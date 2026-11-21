// Capturas de una versión de la app para historial/<version>/.
// Uso: NODE_PATH=<carpeta con playwright-core>/node_modules node historial/capturar.js <url> <carpeta-salida>
// La URL puede ser la app de la raíz servida localmente (python -m http.server) o dev/index.html.
// Carga datos de ejemplo en el navegador y bloquea las llamadas a Google: nunca toca el Sheet real.
'use strict';
const { webkit, devices } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const [url, salida] = process.argv.slice(2);
if (!url || !salida) { console.error('Uso: node capturar.js <url> <carpeta-salida>'); process.exit(1); }
fs.mkdirSync(salida, { recursive: true });

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Mismos ejemplos que dev/mock.js, agrupados por mes como la caché de la app. */
function cacheEjemplo() {
  const base = [
    [0, 'Alimentación', 23450, 'Supermercado'], [0, 'Transporte', 3200, 'SUBE'], [1, 'Restaurant', 38500, 'Cena con amigos'],
    [2, 'Casa', 21000, 'Ferretería'], [3, 'Salud', 9800, 'Farmacia'], [4, 'Alimentación', 12000, 'Verdulería'],
    [5, 'Ocio', 18000, 'Cine'], [6, 'Transporte', 45000, 'Nafta'], [8, 'Familia', 30000, 'Regalo cumpleaños'],
    [9, 'Restaurant', 15000, 'Almuerzo'], [11, 'Alimentación', 54300, 'Compra del mes'], [13, 'Casa', 62000, 'Expensas'],
    [15, 'Ocio', 9500, 'Streaming'], [17, 'Salud', 25000, 'Consulta'], [19, 'Restaurant', 22000, ''],
    [21, 'Alimentación', 8700, 'Panadería'], [24, 'Transporte', 41000, 'Nafta'], [26, 'Familia', 15000, 'Salida con los chicos'],
    [28, 'Alimentación', 61200, 'Supermercado'], [30, 'Casa', 62000, 'Expensas'], [32, 'Restaurant', 27500, 'Cumpleaños'],
    [34, 'Ocio', 12000, 'Teatro'], [36, 'Alimentación', 9900, 'Carnicería'], [38, 'Salud', 7400, 'Farmacia'],
    [40, 'Transporte', 3200, 'SUBE'], [42, 'Alimentación', 48700, 'Supermercado'], [44, 'Casa', 18500, 'Luz'],
  ];
  const cache = {};
  base.forEach(([dias, categoria, monto, descripcion], i) => {
    const d = new Date(); d.setDate(d.getDate() - dias); d.setHours(12 - (i % 5), 0, 0, 0);
    const it = { id: 'ejemplo-' + pad(i), fecha: iso(d), monto, categoria, descripcion, creado: d.toISOString() };
    (cache[it.fecha.slice(0, 7)] ||= []).push(it);
  });
  return cache;
}

(async () => {
  const b = await webkit.launch();
  for (const modo of ['claro', 'oscuro']) {
    const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: modo === 'claro' ? 'light' : 'dark' });
    const datos = JSON.stringify(cacheEjemplo());
    await ctx.addInitScript(d => {
      for (const pref of ['gastos', 'gastos-dev']) {
        localStorage.setItem(pref + '.cache', d);
        localStorage.setItem(pref + '.config', JSON.stringify({ url: 'https://script.google.com/macros/s/EJEMPLO/exec', token: 'ejemplo-sin-conexion-real-000000' }));
      }
    }, datos);
    await ctx.route('https://script.google.com/**', r => r.abort());   // nunca llamar al Sheet real
    const p = await ctx.newPage();
    await p.goto(url); await p.waitForTimeout(1200);
    // Ocultar la franja de desarrollo y el aviso de "sin conexión" que provoca el bloqueo
    await p.addStyleTag({ content: '.dev-barra, .toast { display: none !important; }' });
    await p.evaluate(() => { const e = document.querySelector('#estado'); if (e) e.style.visibility = 'hidden'; });

    const foto = nombre => p.screenshot({ path: path.join(salida, `${nombre}-${modo}.png`) });

    // Cargar: monto y categoría elegidos
    await p.focus('#monto'); await p.keyboard.type('12500');
    await p.click('#categorias button:has-text("Restaurant")');
    await p.evaluate(() => document.activeElement.blur());
    await p.waitForTimeout(300);
    await foto('1-cargar');

    // Resumen
    await p.click('#monto-borrar'); await p.evaluate(() => document.activeElement.blur());
    await p.click('.tab[data-vista="resumen"]'); await p.waitForTimeout(800);
    await foto('2-resumen');
    await ctx.close();
  }
  await b.close();
  console.log('Capturas en', salida, fs.readdirSync(salida).join(', '));
})();
