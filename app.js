'use strict';

// ---------- Constantes ----------
const CATEGORIAS = [
  { id: 'Restaurant', emo: '🍽️' },
  { id: 'Alimentación', emo: '🛒' },
  { id: 'Salud', emo: '💊' },
  { id: 'Casa', emo: '🏠' },
  { id: 'Familia', emo: '👨‍👩‍👧' },
  { id: 'Transporte', emo: '🚗' },
  { id: 'Ocio', emo: '🎉' },
];
const EMO = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.emo]));
const K = { config: 'gastos.config', cola: 'gastos.cola', cache: 'gastos.cache' };
const fmtEntero = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtDecimal = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = { format: n => (Number.isInteger(Math.round(n * 100) / 100) ? fmtEntero : fmtDecimal).format(n) };
const $ = sel => document.querySelector(sel);

// ---------- Almacenamiento local (cola + caché) ----------
const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
const config = () => { const c = store.get(K.config, null); return c && c.url && c.token ? c : null; };

// ---------- Fechas ----------
const pad = n => String(n).padStart(2, '0');
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoyISO = () => isoLocal(new Date());
const haceDias = n => { const d = new Date(); d.setDate(d.getDate() - n); return isoLocal(d); };
const mesDe = fecha => fecha.slice(0, 7);
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
function moverMes(mes, delta) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
const nombreMes = mes => {
  const s = parseISO(mes + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const nombreDia = fecha => parseISO(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));

/** Acepta "1.234,50", "1234,5", "1234.5", "1.500" (= mil quinientos). */
function parseMonto(txt) {
  let s = String(txt).replace(/[\s$]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1 || /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Number(s);
}

// ---------- Estado ----------
let mesActual = mesDe(hoyISO());
let editando = null;        // gasto que se está editando (o null)
let categoriaSel = null;
let sincronizando = false;
let enVuelo = null;          // qid de la operación que se está enviando
let errorSync = '';

// ---------- API ----------
class ErrorRed extends Error {}
class ErrorConfig extends Error {}
class ErrorServidor extends Error {}

async function api(action, payload = {}, cfg = config()) {
  if (!cfg) throw new ErrorConfig('Falta configurar la conexión');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  let resp;
  try {
    resp = await fetch(cfg.url, {
      method: 'POST',
      // text/plain evita el preflight CORS que Apps Script no soporta
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: cfg.token, action, ...payload }),
      signal: ctrl.signal,
    });
  } catch {
    throw new ErrorRed('Sin conexión');
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new ErrorRed('Error HTTP ' + resp.status);
  let data;
  try { data = await resp.json(); }
  catch { throw new ErrorConfig('Respuesta inválida: revisá que la Web App tenga acceso "Cualquier usuario"'); }
  if (!data.ok) {
    if (/token/i.test(data.error)) throw new ErrorConfig('Token inválido');
    throw new ErrorServidor(data.error || 'Error del servidor');
  }
  return data;
}

// ---------- Cola de operaciones pendientes ----------
function encolar(action, item) {
  let cola = store.get(K.cola, []);
  const libre = o => o.item.id === item.id && o.qid !== enVuelo;
  const iAdd = cola.findIndex(o => libre(o) && o.action === 'add');

  if (action === 'update' && iAdd >= 0) {
    cola[iAdd].item = item;                                   // todavía no subió: modificar el alta
  } else if (action === 'delete' && iAdd >= 0) {
    cola = cola.filter(o => !libre(o));                       // nunca llegó al Sheet: descartar
  } else {
    if (action !== 'add') cola = cola.filter(o => !(libre(o) && o.action === 'update'));
    cola.push({ qid: nuevoId(), action, item });
  }
  store.set(K.cola, cola);
}

function aplicarACache(action, item) {
  const cache = store.get(K.cache, {});
  for (const m of Object.keys(cache)) cache[m] = cache[m].filter(i => i.id !== item.id);
  if (action !== 'delete') {
    const m = mesDe(item.fecha);
    if (cache[m]) cache[m].push(item);
  }
  store.set(K.cache, cache);
}

async function sincronizar() {
  if (sincronizando) return;
  if (!config()) { renderEstado(); return; }
  sincronizando = true;
  errorSync = '';
  renderEstado();
  try {
    let cola = store.get(K.cola, []);
    while (cola.length) {
      const op = cola[0];
      enVuelo = op.qid;
      try {
        await api(op.action, { item: op.item });
        aplicarACache(op.action, op.item);
      } catch (e) {
        if (!(e instanceof ErrorServidor)) throw e;
        toast('No se pudo guardar un gasto: ' + e.message);  // dato inválido: no bloquear la cola
      }
      enVuelo = null;
      cola = store.get(K.cola, []).filter(o => o.qid !== op.qid);
      store.set(K.cola, cola);
      render();
    }
    await cargarMes(mesActual);
  } catch (e) {
    errorSync = e.message || 'Error';
  } finally {
    enVuelo = null;
    sincronizando = false;
    render();
  }
}

async function cargarMes(mes) {
  const { items } = await api('list', { mes });
  const cache = store.get(K.cache, {});
  cache[mes] = items;
  store.set(K.cache, cache);
}

/** Gastos del mes = caché del servidor + operaciones pendientes aplicadas encima. */
function gastosDelMes(mes) {
  let items = (store.get(K.cache, {})[mes] || []).slice();
  for (const op of store.get(K.cola, [])) {
    items = items.filter(i => i.id !== op.item.id);
    if (op.action !== 'delete' && mesDe(op.item.fecha) === mes) items.push({ ...op.item, pendiente: true });
  }
  return items.sort((a, b) => b.fecha.localeCompare(a.fecha) || String(b.creado || '').localeCompare(String(a.creado || '')));
}

// ---------- Render ----------
function render() {
  renderEstado();
  if ($('#vista-resumen').classList.contains('activa')) renderResumen();
}

function renderEstado() {
  const el = $('#estado');
  const pend = store.get(K.cola, []).length;
  el.className = 'estado';
  if (!config()) { el.textContent = 'Sin configurar'; return; }
  if (sincronizando) { el.textContent = '↻ Sincronizando…'; return; }
  if (errorSync) { el.textContent = '⚠ ' + errorSync + (pend ? ` · ${pend} pend.` : ''); el.classList.add('pend'); return; }
  if (pend) { el.textContent = `↻ ${pend} pendiente${pend > 1 ? 's' : ''}`; el.classList.add('pend'); return; }
  el.textContent = '✓ Al día';
  el.classList.add('ok');
}

function renderResumen() {
  $('#mes-label').textContent = nombreMes(mesActual);
  $('#mes-sig').disabled = mesActual >= mesDe(hoyISO());
  $('#mes-sig').style.visibility = $('#mes-sig').disabled ? 'hidden' : 'visible';

  const items = gastosDelMes(mesActual);
  const total = items.reduce((s, i) => s + i.monto, 0);
  $('#total-mes').textContent = fmt.format(total);
  $('#cant-mes').textContent = items.length ? `${items.length} gasto${items.length > 1 ? 's' : ''}` : '';

  // Por categoría
  const porCat = {};
  for (const i of items) porCat[i.categoria] = (porCat[i.categoria] || 0) + i.monto;
  const filas = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  const max = filas.length ? filas[0][1] : 0;
  const ul = $('#por-categoria');
  ul.replaceChildren();
  if (!filas.length) ul.append(el('li', { className: 'vacio' }, 'Sin gastos este mes'));
  for (const [cat, monto] of filas) {
    const pct = total ? Math.round((monto / total) * 100) : 0;
    const barra = el('div', { className: 'barra' }, el('i', { style: `width:${max ? (monto / max) * 100 : 0}%` }));
    ul.append(el('li', {},
      el('span', {}, `${EMO[cat] || '•'} ${cat}`),
      el('span', { className: 'monto' }, fmt.format(monto), el('span', { className: 'pct' }, `${pct}%`)),
      barra));
  }

  // Lista agrupada por día
  const lista = $('#lista');
  lista.replaceChildren();
  if (!items.length) { lista.append(el('p', { className: 'vacio' }, 'Todavía no hay gastos.')); return; }
  const dias = new Map();
  for (const i of items) { if (!dias.has(i.fecha)) dias.set(i.fecha, []); dias.get(i.fecha).push(i); }
  for (const [fecha, gs] of dias) {
    const totDia = gs.reduce((s, i) => s + i.monto, 0);
    const grupo = el('div', { className: 'dia' },
      el('div', { className: 'dia-head' }, el('span', {}, nombreDia(fecha)), el('span', {}, fmt.format(totDia))));
    for (const g of gs) {
      const btn = el('button', { className: 'item', type: 'button' },
        el('span', { className: 'emo' }, EMO[g.categoria] || '•'),
        el('span', { className: 'info' },
          el('span', { className: 'cat' }, g.categoria),
          g.descripcion ? el('span', { className: 'desc' }, g.descripcion) : ''),
        el('span', { className: 'monto' }, fmt.format(g.monto),
          g.pendiente ? el('span', { className: 'pend', title: 'Pendiente de subir' }, '●') : ''));
      btn.addEventListener('click', () => editar(g));
      grupo.append(btn);
    }
    lista.append(grupo);
  }
}

/** Crea elementos sin innerHTML (evita inyección con la descripción). */
function el(tag, props, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'style') n.setAttribute('style', v); else n[k] = v;
  }
  for (const h of hijos) if (h !== '' && h != null) n.append(h);
  return n;
}

// ---------- Formulario ----------
function renderCategorias() {
  const cont = $('#categorias');
  cont.replaceChildren();
  for (const c of CATEGORIAS) {
    const b = el('button', { type: 'button', className: 'chip' }, el('span', { className: 'emo' }, c.emo), c.id);
    b.setAttribute('aria-pressed', String(categoriaSel === c.id));
    b.addEventListener('click', () => { categoriaSel = c.id; renderCategorias(); ocultarError(); });
    cont.append(b);
  }
}

function setFecha(f) { $('#fecha').value = f; }

function limpiarForm(conservarFecha) {
  editando = null;
  categoriaSel = null;
  $('#monto').value = '';
  $('#descripcion').value = '';
  if (!conservarFecha) setFecha(hoyISO());
  $('#titulo').textContent = 'Nuevo gasto';
  $('#btn-guardar').textContent = 'Guardar gasto';
  $('#acciones-edicion').hidden = true;
  ocultarError();
  renderCategorias();
}

function editar(g) {
  editando = g;
  categoriaSel = g.categoria;
  $('#monto').value = String(g.monto).replace('.', ',');
  $('#descripcion').value = g.descripcion || '';
  setFecha(g.fecha);
  $('#titulo').textContent = 'Editar gasto';
  $('#btn-guardar').textContent = 'Guardar cambios';
  $('#acciones-edicion').hidden = false;
  renderCategorias();
  mostrarVista('cargar', true);
}

function mostrarError(msg) { const e = $('#error-form'); e.textContent = msg; e.hidden = false; }
function ocultarError() { $('#error-form').hidden = true; }

function guardar(ev) {
  ev.preventDefault();
  const monto = parseMonto($('#monto').value);
  const fecha = $('#fecha').value;
  if (!(monto > 0)) return mostrarError('Ingresá un monto válido.');
  if (!categoriaSel) return mostrarError('Elegí una categoría.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return mostrarError('Elegí una fecha.');

  const item = {
    id: editando ? editando.id : nuevoId(),
    fecha,
    monto: Math.round(monto * 100) / 100,
    categoria: categoriaSel,
    descripcion: $('#descripcion').value.trim().slice(0, 200),
    creado: editando ? editando.creado : new Date().toISOString(),
  };
  const eraEdicion = !!editando;
  encolar(eraEdicion ? 'update' : 'add', item);
  toast(eraEdicion ? 'Cambios guardados' : `Guardado: ${fmt.format(item.monto)} en ${item.categoria}`);
  limpiarForm(!eraEdicion);    // al cargar varios del mismo día, mantiene la fecha
  if (eraEdicion) mostrarVista('resumen');
  render();
  sincronizar();
}

function borrar() {
  if (!editando) return;
  if (!confirm(`¿Borrar ${fmt.format(editando.monto)} de ${editando.categoria}?`)) return;
  encolar('delete', { id: editando.id, fecha: editando.fecha });
  limpiarForm();
  toast('Gasto borrado');
  mostrarVista('resumen');
  sincronizar();
}

// ---------- Navegación ----------
function mostrarVista(nombre, mantenerEdicion) {
  if (nombre !== 'cargar' && editando && !mantenerEdicion) limpiarForm();
  document.querySelectorAll('.vista').forEach(v => v.classList.toggle('activa', v.id === 'vista-' + nombre));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('activa', t.dataset.vista === nombre));
  if (nombre === 'resumen') { $('#titulo').textContent = 'Resumen'; renderResumen(); }
  else $('#titulo').textContent = editando ? 'Editar gasto' : 'Nuevo gasto';
  window.scrollTo(0, 0);
}

async function cambiarMes(delta) {
  mesActual = moverMes(mesActual, delta);
  renderResumen();
  if (config() && !sincronizando) {
    try { await cargarMes(mesActual); renderResumen(); } catch { /* se queda con la caché */ }
  }
}

// ---------- Configuración ----------
function abrirConfig() {
  const c = store.get(K.config, {}) || {};
  $('#cfg-url').value = c.url || '';
  $('#cfg-token').value = c.token || '';
  cfgMsg('');
  $('#dlg-config').showModal();
}

function cfgMsg(texto, esError) {
  const m = $('#cfg-msg');
  m.textContent = texto;
  m.hidden = !texto;
  m.classList.toggle('err', !!esError);
  if (texto) m.scrollIntoView({ block: 'nearest' });
}

/** Tolera lo que agrega el copiar/pegar: espacios, saltos, comillas, puntos finales, texto alrededor. */
function limpiarUrl(txt) {
  const s = String(txt).replace(/[\s​-‍﻿`"'“”‘’<>]/g, '');
  const m = s.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
  return m ? m[0] : s;
}
const limpiarToken = txt => String(txt).replace(/[^A-Za-z0-9]/g, '');

async function guardarConfig(ev) {
  if (ev) ev.preventDefault();
  const cfg = { url: limpiarUrl($('#cfg-url').value), token: limpiarToken($('#cfg-token').value) };
  $('#cfg-url').value = cfg.url;
  $('#cfg-token').value = cfg.token;
  document.activeElement && document.activeElement.blur();   // baja el teclado para que se vea el mensaje

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(cfg.url)) {
    return cfgMsg('✗ La URL no es válida. Tiene que ser https://script.google.com/macros/s/…/exec', true);
  }
  if (cfg.token.length < 20) return cfgMsg(`✗ El token parece incompleto (${cfg.token.length} caracteres, deberían ser 40).`, true);

  cfgMsg('Probando conexión…');
  $('#cfg-guardar').disabled = true;
  try {
    await api('ping', {}, cfg);
    store.set(K.config, cfg);
    if (!config()) throw new Error('Safari no permitió guardar la configuración en este teléfono');
    $('#dlg-config').close();
    toast('Conexión configurada ✓');
    sincronizar();
  } catch (e) {
    cfgMsg('✗ ' + e.message, true);
  } finally {
    $('#cfg-guardar').disabled = false;
  }
}

// ---------- Toast ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---------- Inicio ----------
function init() {
  limpiarForm();
  $('#fecha').max = hoyISO();
  $('#form').addEventListener('submit', guardar);
  $('#monto').addEventListener('input', ocultarError);
  document.querySelectorAll('[data-dias]').forEach(b => b.addEventListener('click', () => setFecha(haceDias(Number(b.dataset.dias)))));
  $('#btn-borrar').addEventListener('click', borrar);
  $('#btn-cancelar').addEventListener('click', () => { limpiarForm(); mostrarVista('resumen'); });
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => mostrarVista(t.dataset.vista)));
  $('#mes-ant').addEventListener('click', () => cambiarMes(-1));
  $('#mes-sig').addEventListener('click', () => cambiarMes(1));
  $('#btn-config').addEventListener('click', abrirConfig);
  $('#cfg-guardar').addEventListener('click', guardarConfig);
  $('#form-config').addEventListener('submit', guardarConfig);
  $('#cfg-cancelar').addEventListener('click', () => $('#dlg-config').close());
  $('#estado').addEventListener('click', () => (config() ? sincronizar() : abrirConfig()));

  window.addEventListener('online', sincronizar);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      $('#fecha').max = hoyISO();
      sincronizar();
    }
  });

  render();
  if (!config()) abrirConfig(); else sincronizar();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();
