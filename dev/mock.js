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
  if (!ls.get(PREF + '.config')) ls.set(PREF + '.config', { url: 'https://script.google.com/macros/s/DEMO/exec', token: 'demo-token-de-desarrollo-0000000000' });

  // ---------- Servidor simulado (mismo contrato que apps-script/Code.gs) ----------
  const fetchReal = window.fetch.bind(window);
  window.fetch = async (url, opts) => {
    if (!String(url).startsWith('https://script.google.com/')) return fetchReal(url, opts);
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
    if (ls.get(CLAVE_OFFLINE)) throw new TypeError('Sin conexión (simulada)');

    const req = JSON.parse(opts && opts.body || '{}');
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
