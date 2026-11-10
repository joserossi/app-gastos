/**
 * API de Gastos — Google Apps Script
 *
 * Pegá este archivo en Extensiones → Apps Script del Google Sheet.
 * 1) Ejecutá la función `setup` una vez (crea la hoja y genera el token).
 * 2) Implementá como "Aplicación web": Ejecutar como "Yo", acceso "Cualquier usuario".
 *
 * El token NO está en este archivo: se guarda en las Propiedades del script.
 */

const HOJA = 'Gastos';
const ENCABEZADOS = ['ID', 'Fecha', 'Monto', 'Categoría', 'Descripción', 'Creado', 'Modificado'];
const CATEGORIAS = ['Restaurant', 'Alimentación', 'Salud', 'Casa', 'Familia', 'Transporte', 'Ocio'];

/** Ejecutar una vez desde el editor. Muestra el token en el registro de ejecución. */
function setup() {
  const sh = hoja_();
  sh.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
  sh.getRange('C2:C').setNumberFormat('#,##0.00');
  sh.getRange('F2:G').setNumberFormat('yyyy-mm-dd hh:mm');

  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    props.setProperty('TOKEN', token);
  }
  Logger.log('TOKEN (copialo en la app): ' + token);
}

/** Si alguna vez necesitás invalidar el token actual, ejecutá esto y copiá el nuevo. */
function regenerarToken() {
  PropertiesService.getScriptProperties().deleteProperty('TOKEN');
  setup();
}

function doGet() {
  return ContentService.createTextOutput('API de gastos funcionando.');
}

function doPost(e) {
  let res;
  const lock = LockService.getScriptLock();
  try {
    const req = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || req.token !== token) throw new Error('Token inválido');

    lock.waitLock(20000);
    switch (req.action) {
      case 'ping':   res = { ok: true }; break;
      case 'add':    res = { ok: true, item: guardar_(validar_(req.item), true) }; break;
      case 'update': res = { ok: true, item: guardar_(validar_(req.item), false) }; break;
      case 'delete': borrar_(String(req.item && req.item.id || '')); res = { ok: true }; break;
      case 'list':   res = { ok: true, items: listar_(String(req.mes || '')) }; break;
      default: throw new Error('Acción desconocida: ' + req.action);
    }
  } catch (err) {
    res = { ok: false, error: String(err && err.message || err) };
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- internos ----------

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
}

function validar_(it) {
  if (!it || typeof it !== 'object') throw new Error('Falta el gasto');
  const id = String(it.id || '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) throw new Error('ID inválido');
  const fecha = String(it.fecha || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Fecha inválida');
  const monto = Number(it.monto);
  if (!isFinite(monto) || monto <= 0) throw new Error('Monto inválido');
  const categoria = String(it.categoria || '');
  if (CATEGORIAS.indexOf(categoria) < 0) throw new Error('Categoría inválida');
  let descripcion = String(it.descripcion || '').trim().slice(0, 200);
  // Evita que un texto se interprete como fórmula en el Sheet
  if (/^[=+\-@]/.test(descripcion)) descripcion = "'" + descripcion;
  return { id: id, fecha: fecha, monto: Math.round(monto * 100) / 100, categoria: categoria, descripcion: descripcion };
}

function buscarFila_(sh, id) {
  const ultima = sh.getLastRow();
  if (ultima < 2) return 0;
  const celda = sh.getRange(2, 1, ultima - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return celda ? celda.getRow() : 0;
}

/** Alta idempotente: si el ID ya existe (reintento), actualiza en lugar de duplicar. */
function guardar_(it, esAlta) {
  const sh = hoja_();
  const fila = buscarFila_(sh, it.id);
  const ahora = new Date();
  if (fila) {
    sh.getRange(fila, 2, 1, 4).setValues([[it.fecha, it.monto, it.categoria, it.descripcion]]);
    if (!esAlta) sh.getRange(fila, 7).setValue(ahora);
  } else {
    sh.appendRow([it.id, it.fecha, it.monto, it.categoria, it.descripcion, ahora, '']);
  }
  return it;
}

function borrar_(id) {
  if (!id) throw new Error('Falta el ID');
  const sh = hoja_();
  const fila = buscarFila_(sh, id);
  if (fila) sh.deleteRow(fila);
}

function listar_(mes) {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error('Mes inválido');
  const sh = hoja_();
  const ultima = sh.getLastRow();
  if (ultima < 2) return [];
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const filas = sh.getRange(2, 1, ultima - 1, 6).getValues();
  const items = [];
  for (const f of filas) {
    if (!f[0]) continue;
    const fecha = f[1] instanceof Date ? Utilities.formatDate(f[1], tz, 'yyyy-MM-dd') : String(f[1]).slice(0, 10);
    if (fecha.slice(0, 7) !== mes) continue;
    let descripcion = String(f[4] || '');
    items.push({
      id: String(f[0]),
      fecha: fecha,
      monto: Number(f[2]) || 0,
      categoria: String(f[3]),
      descripcion: descripcion,
      creado: f[5] instanceof Date ? f[5].toISOString() : '',
    });
  }
  return items;
}
