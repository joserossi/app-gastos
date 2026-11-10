# Gastos: contexto del proyecto

PWA personal para registrar gastos diarios desde un iPhone 13. Los datos se guardan en un Google Sheet del Drive del dueño. Uso individual, en pesos argentinos (ARS). La interfaz y el código están en español rioplatense.

> El repo es **público**. Nunca commitear la URL `/exec` de la Web App ni el token.

## Arquitectura

```
iPhone (PWA instalada desde Safari)
  │  HTML/JS/CSS sin frameworks ni build, servido por GitHub Pages
  │  cola local de cambios pendientes (localStorage)
  ▼  POST text/plain con JSON {token, action, ...}
Google Apps Script (Web App, "Ejecutar como: Yo", acceso "Cualquier usuario")
  ▼
Google Sheet "Gastos", pestaña "Gastos"
```

| Recurso | Dónde |
|---|---|
| Página publicada | https://joserossi.github.io/app-gastos/ |
| Repositorio | https://github.com/joserossi/app-gastos (rama `main`, Pages desde `/`) |
| Sheet | "Gastos" en `Mi unidad/app-backends/app-gastos` |
| Apps Script | Vinculado al Sheet (Extensiones → Apps Script) |
| URL `/exec` y token | Solo en el iPhone (⚙︎ de la app) y en las Propiedades del script. No están en el repo. |

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Dos vistas (Cargar, Resumen), barra de pestañas, diálogo de configuración |
| `app.js` | Toda la lógica: formulario, formato del monto, cola offline, sincronización, resumen |
| `styles.css` | Tokens de color con modo oscuro, márgenes seguros del iPhone, inputs de 16px o más (evitan el zoom de iOS) |
| `sw.js` | Service worker: red primero y caché si no hay señal. **Subir `VERSION` en cada cambio.** |
| `manifest.json`, `icons/` | Datos de instalación de la PWA. iOS usa `icon-180.png` como apple-touch-icon. |
| `apps-script/Code.gs` | Backend. Se copia a mano en el editor de Apps Script. |
| `README.md` | Instalación paso a paso para una persona |

## Datos

Columnas del Sheet: `ID | Fecha | Monto | Categoría | Descripción | Creado | Modificado`

- `ID`: UUID generado en el teléfono. Hace que las altas sean idempotentes: si el ID ya existe, se actualiza en vez de duplicar.
- `Fecha`: `yyyy-mm-dd`, elegida por el usuario (se pueden cargar días anteriores, no futuros).
- `Monto`: número con 2 decimales como máximo.
- `Categoría`: una de `Restaurant, Alimentación, Salud, Casa, Familia, Transporte, Ocio`. Está definida en `CATEGORIAS` en **dos lugares**, `app.js` (con emoji) y `Code.gs` (validación), y se cambian juntas.
- Zona horaria del Sheet: `America/Argentina/Buenos_Aires`, locale `es_AR`.
- Las filas **no** siguen un orden. Al borrar, la última fila pasa al lugar de la borrada.

## API (`doPost`)

Pedido: `{"token": "...", "action": "...", ...}` enviado como `Content-Type: text/plain`.

| action | Extra | Respuesta ok | Bloqueo |
|---|---|---|---|
| `ping` | | `{ok:true}` | no |
| `list` | `mes: "yyyy-mm"` | `{ok:true, items:[{id,fecha,monto,categoria,descripcion,creado}]}` | no |
| `add` / `update` | `item: {id,fecha,monto,categoria,descripcion}` | `{ok:true, item}` | sí |
| `delete` | `item: {id}` | `{ok:true}` | sí |

Errores: `{ok:false, error, invalido?:true, reintentar?:true}`.
- `"Token inválido"`: la app pide revisar la configuración.
- `invalido:true`: dato rechazado. La app descarta esa operación.
- Cualquier otro error: la app deja la operación pendiente y reintenta cada 30 s.

## Decisiones tomadas y por qué

- **Apps Script como intermediario** en lugar de OAuth y la Sheets API desde el navegador. El login de Google falla en PWAs de iOS en modo standalone, y sin servidor el token de acceso vence cada hora.
- **Acceso "Cualquier usuario"** en la Web App. Con "Solo yo", el pedido desde `github.io` llega sin la sesión de Google, porque Safari no la comparte entre sitios, y Google responde con una página de login. La seguridad la da el token de 40 caracteres guardado en `PropertiesService`. El Sheet sigue siendo privado.
- **POST como `text/plain`**: evita el preflight CORS, que Apps Script no soporta. La respuesta, después de la redirección a `script.googleusercontent.com`, trae `Access-Control-Allow-Origin: *`.
- **Configuración en el teléfono** (localStorage `gastos.config`), así la URL y el token quedan fuera del repo público.
- **Sin `deleteRow()`**: a veces tardaba minutos (se midieron 223 s) y retenía el bloqueo del script, lo que hacía fallar todo lo demás. Borrar = mover la última fila al hueco y vaciar la última.
- **Lecturas sin bloqueo**; escrituras con `tryLock(10000)` que devuelve `reintentar:true` si no lo consigue.
- **Búsqueda por ID con `getValues()`** de la columna A, no con TextFinder.
- **Texto que empieza con `= + - @`** se guarda con `'` adelante para que no se interprete como fórmula (`comoTexto_`).
- **Cola offline**: los cambios se aplican primero en el teléfono y se suben en orden. Una edición o un borrado sobre un alta todavía no subida se combina con ella. La operación que se está enviando no se modifica (`enVuelo`).
- **Monto**: se formatea con puntos de miles mientras se escribe. Un "." tipeado se toma como coma decimal, porque los puntos los pone la app. `parseMonto` acepta `1.234,50`, `1234.5`, `1.500` (= 1500) y `$ 2.300`.
- **Campo del token como texto**, no `password`: el llavero de iOS puede reemplazar lo pegado. La URL y el token se limpian al pegar (espacios, comillas, texto alrededor).
- **Service worker red primero**: los cambios llegan en la primera apertura. Sin señal, usa la caché.

## Cómo publicar cambios

**Frontend:** editar, subir `VERSION` en `sw.js`, commit y `git push`. GitHub Pages publica en 1 o 2 minutos. En el iPhone hay que cerrar la app del todo y abrirla de nuevo.
- En esta PC git necesita `http.sslBackend=schannel`, ya configurado en el repo. Si no, falla con "SSL certificate problem".
- La autenticación es con `gh` (`gh auth setup-git`).

**Backend:** Claude no puede publicar el Apps Script. El dueño tiene que:
1. Pegar el nuevo `Code.gs` en el editor de Apps Script y guardar.
2. Ir a **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. Así la URL no cambia.

No hace falta volver a correr `setup`. Cambiar el nombre del proyecto de Apps Script no afecta nada.

## Cómo probar

- **API con curl:** mandar el JSON desde un **archivo UTF-8** (`--data-binary @archivo.json`). Pasado como argumento en la terminal de Windows, las tildes se rompen y aparece "Categoría inválida" sin que sea un bug. Usar `--ssl-no-revoke` y `-L`.
- **Interfaz:** con `playwright-core` en la carpeta temporal, usando WebKit (el motor de Safari) y `devices['iPhone 13']`, contra `python -m http.server` local o contra la página publicada. WebKit se descarga con `node --use-system-ca node_modules/playwright-core/cli.js install webkit`.
- Usar IDs de prueba con prefijo `prueba-claude-` y **borrarlos al terminar**. El Sheet tiene datos reales.

## Estado

- 10/11/2026: primera versión en uso. Carga, resumen mensual por categoría, edición, borrado, uso sin conexión, separador de miles y botón × en el monto.
- El dueño la va a usar unos días antes de decidir mejoras.
