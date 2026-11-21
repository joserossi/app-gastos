'use strict';

// ---------- Constantes ----------
// Cada categoría tiene un ícono y un color (clase .cat-<clave> en styles.css). El orden fija el color.
const CATEGORIAS = [
  { id: 'Restaurant', clave: 'restaurant' },
  { id: 'Alimentación', clave: 'alimentacion' },
  { id: 'Salud', clave: 'salud' },
  { id: 'Casa', clave: 'casa' },
  { id: 'Familia', clave: 'familia' },
  { id: 'Transporte', clave: 'transporte' },
  { id: 'Ocio', clave: 'ocio' },
];
const CLAVE = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.clave]));

// Íconos de línea propios (24×24, trazo). Texto fijo: es seguro insertarlo como SVG.
const ICONOS = {
  restaurant: '<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 6.5V14H17"/>',
  alimentacion: '<path d="M2.5 3.5h2.6l2.4 11a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2l1.8-7.1H6.1"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>',
  salud: '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8v8M8 12h8"/>',
  casa: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>',
  familia: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.6A4.5 4.5 0 0 1 21.5 19"/>',
  transporte: '<path d="M5 16.5H3.5V12l2-5h13l2 5v4.5H19"/><path d="M3.5 12h17"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M9.5 16.5h5"/>',
  ocio: '<path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1z"/><path d="M15 6.5v2M15 11v2M15 15.5v2"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  mas: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  resumen: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  izquierda: '<path d="m15 18-6-6 6-6"/>',
  derecha: '<path d="m9 18 6-6-6-6"/>',
  papelera: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
};
function svg(nombre) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.9');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('class', 'ic');
  s.innerHTML = ICONOS[nombre] || '';
  return s;
}
/** Cuadrado de color con el ícono de la categoría. */
const chipCat = cat => el('span', { className: `cat-chip cat-${CLAVE[cat] || 'ocio'}` }, svg(CLAVE[cat] || 'ocio'));

// En desarrollo (dev/mock.js) los datos van a otras claves para no mezclarse con los reales.
const PREF = window.GASTOS_DEV ? 'gastos-dev' : 'gastos';
const K = { config: PREF + '.config', cola: PREF + '.cola', cache: PREF + '.cache' };
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
const nombreDia = fecha => parseISO(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
const fechaLarga = fecha => parseISO(fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const soloMes = mes => parseISO(mes + '-01').toLocaleDateString('es-AR', { month: 'long' });
const diasDelMes = mes => { const [y, m] = mes.split('-').map(Number); return new Date(y, m, 0).getDate(); };

const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));

/** Acepta "1.234,50", "1234,5", "1234.5", "1.500" (= mil quinientos). */
function parseMonto(txt) {
  let s = String(txt).replace(/[\s$]/g, '').replace(/[.,]$/, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1 || /^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Number(s);
}

// ---------- Campo de monto con separador de miles ----------
const MAX_ENTEROS = 12;
const conMiles = digitos => digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** 1500.5 → "1.500,50" (para mostrar un gasto al editarlo). */
function montoATexto(n) {
  const [e, d] = (Math.round(n * 100) / 100).toFixed(2).split('.');
  return d === '00' ? conMiles(e) : conMiles(e) + ',' + d;
}

/** Texto a medio escribir → con puntos de miles. La primera coma es la decimal (máx. 2 decimales). */
function formatearEscritura(raw) {
  const i = raw.indexOf(',');
  let ent = (i < 0 ? raw : raw.slice(0, i)).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_ENTEROS);
  const dec = i < 0 ? null : raw.slice(i + 1).replace(/\D/g, '').slice(0, 2);
  if (dec !== null && ent === '') ent = '0';
  return dec === null ? conMiles(ent) : conMiles(ent) + ',' + dec;
}

function alEscribirMonto(e) {
  const inp = e.target;
  let raw = inp.value;
  let caret = inp.selectionStart == null ? raw.length : inp.selectionStart;

  if (e.inputType === 'insertFromPaste') {
    const n = parseMonto(raw);
    inp.value = isNaN(n) ? formatearEscritura(raw) : montoATexto(n);
    caret = inp.value.length;
  } else {
    // Los puntos los pone la app: un "." tipeado se toma como coma decimal
    if (e.data === '.' && raw[caret - 1] === '.') raw = raw.slice(0, caret - 1) + ',' + raw.slice(caret);
    // Mantener el cursor después de la misma cantidad de dígitos/coma
    let antes = raw.slice(0, caret).replace(/[^\d,]/g, '').length;
    inp.value = formatearEscritura(raw);
    if (inp.value.startsWith('0,') && !/^[^\d,]*0/.test(raw)) antes++;   // se agregó un 0 adelante de la coma
    caret = 0;
    for (let n = 0; caret < inp.value.length && n < antes; caret++) if (/[\d,]/.test(inp.value[caret])) n++;
  }
  if (document.activeElement === inp) inp.setSelectionRange(caret, caret);
  actualizarMontoUI();
  ocultarError();
}

function actualizarMontoUI() {
  const inp = $('#monto');
  const largo = inp.value.length;
  $('#monto-borrar').hidden = !largo;
  inp.classList.toggle('mediano', largo > 9 && largo <= 12);
  inp.classList.toggle('chico', largo > 12);
  // El botón muestra el monto que se va a guardar
  // (al editar no entra junto a Borrar y Cancelar, así que solo dice "Guardar cambios")
  const n = parseMonto(inp.value);
  $('#btn-guardar').textContent = editando ? 'Guardar cambios' : (n > 0 ? `Guardar ${fmt.format(n)}` : 'Guardar gasto');
}

function borrarMonto() {
  $('#monto').value = '';
  actualizarMontoUI();
  $('#monto').focus();
}

// ---------- Estado ----------
let mesActual = mesDe(hoyISO());
let editando = null;        // gasto que se está editando (o null)
let categoriaSel = null;
let filtroCat = null;        // categoría elegida en el Resumen (o null = todas)
let sincronizando = false;
let enVuelo = null;          // qid de la operación que se está enviando
let errorSync = '';
const pidiendo = new Set();  // meses que se están pidiendo en segundo plano

// ---------- API ----------
class ErrorRed extends Error {}
class ErrorConfig extends Error {}
class ErrorServidor extends Error {}

async function api(action, payload = {}, cfg = config()) {
  if (!cfg) throw new ErrorConfig('Falta configurar la conexión');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
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
    throw new ErrorRed(ctrl.signal.aborted ? 'Google tarda en responder' : 'Sin conexión');
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new ErrorRed('Error HTTP ' + resp.status);
  let data;
  try { data = await resp.json(); }
  catch { throw new ErrorConfig('Respuesta inválida: revisá que la Web App tenga acceso "Cualquier usuario"'); }
  if (!data.ok) {
    const err = String(data.error || 'Error del servidor');
    if (/token/i.test(err)) throw new ErrorConfig('Token inválido');
    // Solo un dato inválido se descarta; cualquier otro error (servidor ocupado, etc.) se reintenta
    const invalido = data.invalido === true || (data.invalido === undefined && /inválid|desconocida|^Falta/i.test(err));
    if (invalido) throw new ErrorServidor(err);
    throw new ErrorRed(data.reintentar || /candado|lock/i.test(err) ? 'Servidor ocupado, reintentando' : err);
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
    clearTimeout(reintentoTimer);
    if (errorSync && store.get(K.cola, []).length && config()) reintentoTimer = setTimeout(sincronizar, 30000);
  }
}
let reintentoTimer;

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

/** Punto de estado: verde al día, ámbar con pendientes, rojo si falta configurar. Al tocarlo explica el detalle. */
let estadoTexto = '';
function renderEstado() {
  const b = $('#estado');
  const pend = store.get(K.cola, []).length;
  const pendTxt = pend ? `${pend} gasto${pend > 1 ? 's' : ''} sin subir` : '';
  let estado, corto = '';
  if (!config()) { estado = 'err'; corto = 'Configurar'; estadoTexto = 'Falta configurar la conexión'; }
  else if (sincronizando) { estado = 'sync'; estadoTexto = 'Sincronizando…'; }
  else if (errorSync && /token|configur|inválida/i.test(errorSync)) { estado = 'err'; estadoTexto = errorSync; corto = pend ? String(pend) : ''; }
  else if (errorSync || pend) { estado = 'pend'; corto = pend ? String(pend) : ''; estadoTexto = [errorSync, pendTxt].filter(Boolean).join(' · ') + (pend ? '. Se suben solos al volver la conexión.' : ''); }
  else { estado = 'ok'; estadoTexto = 'Todo guardado en Google Sheets'; }
  b.dataset.estado = estado;
  b.querySelector('.estado-txt').textContent = corto;
  b.setAttribute('aria-label', estadoTexto);
  b.title = estadoTexto;
}

function renderResumen() {
  $('#mes-label').textContent = nombreMes(mesActual);
  $('#mes-sig').disabled = mesActual >= mesDe(hoyISO());
  $('#mes-sig').style.visibility = $('#mes-sig').disabled ? 'hidden' : 'visible';

  const items = gastosDelMes(mesActual);
  const total = items.reduce((s, i) => s + i.monto, 0);
  $('#total-mes').textContent = fmt.format(total);

  // Cantidad y promedio diario (en el mes en curso, sobre los días transcurridos)
  const hoy = hoyISO();
  const esActual = mesActual === mesDe(hoy);
  const diasCorridos = esActual ? Number(hoy.slice(8)) : diasDelMes(mesActual);
  $('#hero-detalle').textContent = items.length
    ? `${items.length} gasto${items.length > 1 ? 's' : ''} · ${fmt.format(Math.round(total / diasCorridos))} por día`
    : 'Sin gastos cargados';

  // Comparación con el mes anterior (en el mes en curso, hasta el mismo día)
  const ant = moverMes(mesActual, -1);
  const comp = $('#comparacion');
  if (store.get(K.cache, {})[ant]) {
    const totalAnt = gastosDelMes(ant).filter(i => Number(i.fecha.slice(8)) <= diasCorridos).reduce((s, i) => s + i.monto, 0);
    const pct = totalAnt ? Math.round(((total - totalAnt) / totalAnt) * 100) : null;
    comp.hidden = pct === null || !items.length;
    if (pct !== null) {
      const ref = esActual ? `que a esta altura de ${soloMes(ant)}` : `que en ${soloMes(ant)}`;
      comp.textContent = pct === 0 ? `Igual ${ref}` : `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct)}% ${pct > 0 ? 'más' : 'menos'} ${ref}`;
      comp.className = 'comparacion' + (pct > 0 ? ' sube' : pct < 0 ? ' baja' : '');
    }
  } else {
    comp.hidden = true;
    if (config() && !pidiendo.has(ant)) {
      pidiendo.add(ant);
      cargarMes(ant).then(renderResumen).catch(() => {}).finally(() => pidiendo.delete(ant));
    }
  }

  // Por categoría
  const porCat = {};
  for (const i of items) porCat[i.categoria] = (porCat[i.categoria] || 0) + i.monto;
  const filas = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  const max = filas.length ? filas[0][1] : 0;
  const ul = $('#por-categoria');
  ul.replaceChildren();
  ul.classList.toggle('filtrando', !!filtroCat);
  if (!filas.length) ul.append(el('li', { className: 'vacio' }, 'Sin gastos este mes'));
  for (const [cat, monto] of filas) {
    const pct = total ? Math.round((monto / total) * 100) : 0;
    const barra = el('div', { className: 'barra' }, el('i', { style: `width:${max ? (monto / max) * 100 : 0}%` }));
    const btn = el('button', { type: 'button', className: `cat-btn cat-${CLAVE[cat] || 'ocio'}` + (filtroCat === cat ? ' activa' : '') },
      chipCat(cat),
      el('span', { className: 'nombre' }, cat),
      el('span', { className: 'monto' }, fmt.format(monto), el('span', { className: 'pct' }, `${pct}%`)),
      barra);
    btn.setAttribute('aria-pressed', String(filtroCat === cat));
    btn.addEventListener('click', () => filtrarCategoria(cat));
    ul.append(el('li', {}, btn));
  }

  // Filtro por categoría
  const chip = $('#filtro-chip');
  chip.hidden = !filtroCat;
  const visibles = filtroCat ? items.filter(i => i.categoria === filtroCat) : items;
  if (filtroCat) {
    const sub = visibles.reduce((s, i) => s + i.monto, 0);
    $('#filtro-texto').textContent = `${filtroCat} · ${fmt.format(sub)}`;
  }

  // Lista agrupada por día
  const lista = $('#lista');
  lista.replaceChildren();
  if (!visibles.length) {
    lista.append(el('p', { className: 'vacio' }, filtroCat ? `Sin gastos de ${filtroCat} este mes.` : 'Todavía no hay gastos.'));
    return;
  }
  const dias = new Map();
  for (const i of visibles) { if (!dias.has(i.fecha)) dias.set(i.fecha, []); dias.get(i.fecha).push(i); }
  for (const [fecha, gs] of dias) {
    const totDia = gs.reduce((s, i) => s + i.monto, 0);
    const grupo = el('div', { className: 'dia' },
      el('div', { className: 'dia-head' }, el('span', {}, nombreDia(fecha)), el('span', {}, fmt.format(totDia))));
    for (const g of gs) {
      const btn = el('button', { className: 'item', type: 'button' },
        chipCat(g.categoria),
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

/** Tocar una categoría filtra la lista; tocar la misma de nuevo quita el filtro. */
function filtrarCategoria(cat) {
  filtroCat = filtroCat === cat ? null : cat;
  renderResumen();
  if (filtroCat) $('#card-gastos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function quitarFiltro() {
  filtroCat = null;
  renderResumen();
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
  cont.classList.toggle('con-seleccion', !!categoriaSel);
  for (const c of CATEGORIAS) {
    const b = el('button', { type: 'button', className: 'cat-tile' }, chipCat(c.id), el('span', { className: 'cat-nombre' }, c.id));
    b.setAttribute('aria-pressed', String(categoriaSel === c.id));
    b.addEventListener('click', () => { categoriaSel = c.id; renderCategorias(); ocultarError(); });
    cont.append(b);
  }
}

function setFecha(f) {
  $('#fecha').value = f;
  renderFecha();
}

/** Hoy / Ayer / Otro día: marca el segmento activo y escribe la fecha completa debajo. */
function renderFecha() {
  const f = $('#fecha').value;
  const cual = f === hoyISO() ? '0' : f === haceDias(1) ? '1' : 'otro';
  document.querySelectorAll('.seg[data-dias]').forEach(s => s.classList.toggle('activa', s.dataset.dias === cual));
  $('#seg-otro').classList.toggle('activa', cual === 'otro');
  $('#fecha-otro-txt').textContent = cual === 'otro' && f ? nombreDia(f) : 'Otro día';
  $('#fecha-larga').textContent = f ? fechaLarga(f) : '';
}

function limpiarForm(conservarFecha) {
  editando = null;
  categoriaSel = null;
  $('#monto').value = '';
  actualizarMontoUI();
  $('#descripcion').value = '';
  if (!conservarFecha) setFecha(hoyISO());
  $('#titulo').textContent = 'Nuevo gasto';
  $('#btn-borrar').hidden = true;
  $('#btn-cancelar').hidden = true;
  ocultarError();
  renderCategorias();
}

function editar(g) {
  editando = g;
  categoriaSel = g.categoria;
  $('#monto').value = montoATexto(g.monto);
  actualizarMontoUI();
  $('#descripcion').value = g.descripcion || '';
  setFecha(g.fecha);
  $('#titulo').textContent = 'Editar gasto';
  $('#btn-borrar').hidden = false;
  $('#btn-cancelar').hidden = false;
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
  document.body.classList.toggle('en-cargar', nombre === 'cargar');
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
  document.querySelectorAll('[data-icono]').forEach(n => n.replaceChildren(svg(n.dataset.icono)));
  limpiarForm();
  $('#fecha').max = hoyISO();
  $('#fecha').addEventListener('change', renderFecha);
  // En navegadores de escritorio el calendario no se abre tocando el campo invisible
  $('#fecha').addEventListener('click', e => { try { e.target.showPicker(); } catch { /* iOS lo abre solo */ } });
  $('#form').addEventListener('submit', guardar);
  $('#monto').addEventListener('input', alEscribirMonto);
  $('#monto-borrar').addEventListener('pointerdown', e => e.preventDefault()); // no cerrar el teclado
  $('#monto-borrar').addEventListener('click', borrarMonto);
  document.querySelectorAll('[data-dias]').forEach(b => b.addEventListener('click', () => setFecha(haceDias(Number(b.dataset.dias)))));
  $('#btn-borrar').addEventListener('click', borrar);
  $('#btn-cancelar').addEventListener('click', () => { limpiarForm(); mostrarVista('resumen'); });
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => mostrarVista(t.dataset.vista)));
  $('#filtro-chip').addEventListener('click', quitarFiltro);
  $('#mes-ant').addEventListener('click', () => cambiarMes(-1));
  $('#mes-sig').addEventListener('click', () => cambiarMes(1));
  $('#btn-config').addEventListener('click', abrirConfig);
  $('#cfg-guardar').addEventListener('click', guardarConfig);
  $('#form-config').addEventListener('submit', guardarConfig);
  $('#cfg-cancelar').addEventListener('click', () => $('#dlg-config').close());
  $('#estado').addEventListener('click', () => {
    if (!config()) return abrirConfig();
    toast(estadoTexto);
    sincronizar();
  });

  window.addEventListener('online', sincronizar);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      $('#fecha').max = hoyISO();
      sincronizar();
    }
  });

  render();
  if (!config()) abrirConfig(); else sincronizar();

  if ('serviceWorker' in navigator && !window.GASTOS_DEV) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();
