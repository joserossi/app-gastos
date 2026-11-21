// Entorno de desarrollo: datos de ejemplo y un servidor simulado.
// No se conecta a Google ni toca el Sheet real. Se carga antes que app.js.
'use strict';
window.GASTOS_DEV = true;

(function () {
  const PREF = 'gastos-dev';
  const CLAVE_DB = PREF + '.servidor';
  const CLAVE_OFFLINE = PREF + '.offline';
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
    borrarTodo() { try { Object.keys(localStorage).filter(k => k.startsWith(PREF + '.')).forEach(k => localStorage.removeItem(k)); } catch { /* nada */ } },
  };

  if (/[?&]reset\b/.test(location.search)) ls.borrarTodo();

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /** ~30 gastos repartidos en los últimos 45 días, siempre relativos a hoy. */
  function ejemplos() {
    const base = [
      [0, 'Alimentación', 23450, 'Supermercado'], [0, 'Transporte', 3200, 'SUBE'],
      [1, 'Restaurant', 38500, 'Cena con amigos'], [2, 'Casa', 21000, 'Ferretería'],
      [3, 'Salud', 9800, 'Farmacia'], [4, 'Alimentación', 12000, 'Verdulería'],
      [5, 'Ocio', 18000, 'Cine'], [6, 'Transporte', 45000, 'Nafta'],
      [8, 'Familia', 30000, 'Regalo cumpleaños'], [9, 'Restaurant', 15000, 'Almuerzo'],
      [11, 'Alimentación', 54300, 'Compra del mes'], [13, 'Casa', 62000, 'Expensas'],
      [15, 'Ocio', 9500, 'Streaming'], [17, 'Salud', 25000, 'Consulta'],
      [19, 'Restaurant', 22000, ''], [21, 'Alimentación', 8700, 'Panadería'],
      [24, 'Transporte', 41000, 'Nafta'], [26, 'Familia', 15000, 'Salida con los chicos'],
      [28, 'Alimentación', 61200, 'Supermercado'], [30, 'Casa', 62000, 'Expensas'],
      [32, 'Restaurant', 27500, 'Cumpleaños'], [34, 'Ocio', 12000, 'Teatro'],
      [36, 'Alimentación', 9900, 'Carnicería'], [38, 'Salud', 7400, 'Farmacia'],
      [40, 'Transporte', 3200, 'SUBE'], [42, 'Alimentación', 48700, 'Supermercado'],
      [44, 'Casa', 18500, 'Luz'],
    ];
    return base.map(([dias, categoria, monto, descripcion], i) => {
      const d = new Date(); d.setDate(d.getDate() - dias); d.setHours(12 - (i % 5), 0, 0, 0);
      return { id: 'ejemplo-' + pad(i), fecha: iso(d), monto, categoria, descripcion, creado: d.toISOString() };
    });
  }

  if (!ls.get(CLAVE_DB)) ls.set(CLAVE_DB, ejemplos());

  // Listas de ejemplo
  const CLAVE_LISTAS = PREF + '.servidor-listas';
  if (!ls.get(CLAVE_LISTAS)) {
    const t = Date.now();
    const item = (id, lista, texto, hecho, n) => ({ id, lista, texto, hecho, orden: t - 100000 + n });
    ls.set(CLAVE_LISTAS, {
      listas: [
        { id: 'lista-super', nombre: 'Supermercado', orden: t - 200000 },
        { id: 'lista-pend', nombre: 'Pendientes', orden: t - 190000 },
      ],
      items: [
        item('it-01', 'lista-super', 'Leche x2', false, 1), item('it-02', 'lista-super', 'Pan lactal', false, 2),
        item('it-03', 'lista-super', 'Yerba', false, 3), item('it-04', 'lista-super', 'Tomates', false, 4),
        item('it-05', 'lista-super', 'Fideos', true, 5), item('it-06', 'lista-super', 'Café', true, 6),
        item('it-07', 'lista-super', 'Detergente', false, 7),
        item('it-08', 'lista-pend', 'Pagar el seguro del auto', false, 8), item('it-09', 'lista-pend', 'Llamar al plomero', false, 9),
        item('it-10', 'lista-pend', 'Renovar el DNI', true, 10),
      ],
    });
  }

  /** Mismas acciones que agrega apps-script/Code.gs para las listas. */
  function servidorListas(req) {
    const db = ls.get(CLAVE_LISTAS) || { listas: [], items: [] };
    const it = req.item || {};
    const [tipo, accion] = req.action.split('.');
    if (req.action === 'listas') return { ok: true, listas: db.listas, items: db.items };
    if (tipo === 'lista') {
      if (accion === 'add' || accion === 'update') { db.listas = db.listas.filter(l => l.id !== it.id); db.listas.push({ id: it.id, nombre: it.nombre, orden: it.orden }); }
      else if (accion === 'delete') { db.listas = db.listas.filter(l => l.id !== it.id); db.items = db.items.filter(i => i.lista !== it.id); }
      else if (accion === 'limpiar') db.items = db.items.filter(i => !(i.lista === it.id && i.hecho));
      else if (accion === 'desmarcar') db.items = db.items.map(i => (i.lista === it.id ? { ...i, hecho: false } : i));
      else return { ok: false, error: 'Acción desconocida', invalido: true };
    } else if (tipo === 'item') {
      if (accion === 'add' || accion === 'update') { db.items = db.items.filter(i => i.id !== it.id); db.items.push({ id: it.id, lista: it.lista, texto: it.texto, hecho: !!it.hecho, orden: it.orden }); }
      else if (accion === 'delete') db.items = db.items.filter(i => i.id !== it.id);
      else return { ok: false, error: 'Acción desconocida', invalido: true };
    } else return null;
    ls.set(CLAVE_LISTAS, db);
    return { ok: true };
  }
  if (!ls.get(PREF + '.config')) ls.set(PREF + '.config', { url: 'https://script.google.com/macros/s/DEMO/exec', token: 'demo-token-de-desarrollo-0000000000' });

  // ---------- Servidor simulado (mismo contrato que apps-script/Code.gs) ----------
  const fetchReal = window.fetch.bind(window);
  window.fetch = async (url, opts) => {
    if (!String(url).startsWith('https://script.google.com/')) return fetchReal(url, opts);
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    if (ls.get(CLAVE_OFFLINE)) throw new TypeError('Sin conexión (simulada)');

    const req = JSON.parse(opts && opts.body || '{}');
    const resListas = servidorListas(req);
    if (resListas) return new Response(JSON.stringify(resListas), { status: 200, headers: { 'Content-Type': 'application/json' } });
    let db = ls.get(CLAVE_DB) || [];
    let res;
    switch (req.action) {
      case 'ping': res = { ok: true }; break;
      case 'list': res = { ok: true, items: db.filter(i => i.fecha.slice(0, 7) === req.mes) }; break;
      case 'add':
      case 'update': {
        const it = { ...req.item };
        const i = db.findIndex(x => x.id === it.id);
        if (i >= 0) db[i] = { ...db[i], ...it }; else db.push({ ...it, creado: new Date().toISOString() });
        res = { ok: true, item: it };
        break;
      }
      case 'delete': db = db.filter(x => x.id !== (req.item && req.item.id)); res = { ok: true }; break;
      default: res = { ok: false, error: 'Acción desconocida', invalido: true };
    }
    ls.set(CLAVE_DB, db);
    return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  // ---------- Franja de desarrollo ----------
  document.addEventListener('DOMContentLoaded', () => {
    const barra = document.createElement('div');
    barra.className = 'dev-barra';
    barra.innerHTML = '<strong>Desarrollo</strong><span>datos de ejemplo</span>'
      + '<button type="button" id="dev-offline"></button>'
      + '<button type="button" id="dev-reset">Reiniciar</button>';
    document.body.prepend(barra);
    const btnOff = barra.querySelector('#dev-offline');
    const pintar = () => { btnOff.textContent = ls.get(CLAVE_OFFLINE) ? 'Conectar' : 'Sin conexión'; };
    btnOff.addEventListener('click', () => {
      ls.set(CLAVE_OFFLINE, !ls.get(CLAVE_OFFLINE)); pintar();
      if (!ls.get(CLAVE_OFFLINE)) window.dispatchEvent(new Event('online'));
    });
    barra.querySelector('#dev-reset').addEventListener('click', () => { ls.borrarTodo(); location.reload(); });
    pintar();
  });
})();
