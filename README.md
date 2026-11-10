# Gastos — PWA personal

PWA para cargar gastos diarios desde el iPhone y guardarlos en un Google Sheet.

```
iPhone (PWA)  ──POST──▶  Google Apps Script (Web App)  ──▶  Google Sheet "Gastos"
cola local si no hay señal         token secreto
```

**Columnas del Sheet:** `ID | Fecha | Monto | Categoría | Descripción | Creado | Modificado`

## 1. Google Sheet + Apps Script

1. En Google Drive creá un Sheet nuevo (por ejemplo "Gastos").
2. Abrí **Extensiones → Apps Script**. Borrá el código de ejemplo y pegá el contenido de [`apps-script/Code.gs`](apps-script/Code.gs). Guardá (💾).
3. En **Configuración del proyecto (⚙️)** verificá que la zona horaria sea `(GMT-03:00) Buenos Aires`. En el Sheet, en **Archivo → Configuración**, también.
4. Arriba, elegí la función **`setup`** y tocá **Ejecutar**.
   - Google pide permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (proyecto) (no seguro) → Permitir*. Es normal: el script es tuyo.
   - En el **Registro de ejecución** aparece `TOKEN (copialo en la app): …`. **Guardalo.**
5. **Implementar → Nueva implementación →** tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   - Tocá **Implementar** y copiá la **URL** (termina en `/exec`).

> "Cualquier usuario" es necesario para que el iPhone pueda llamar sin login. Lo que protege tus datos es el token: sin él, el script rechaza todo.

**Si cambiás `Code.gs` más adelante:** *Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar*. Así la URL no cambia.

## 2. Publicar en GitHub Pages

1. Creá un repositorio en GitHub (por ejemplo `gastos`). Puede ser público: no contiene ni la URL ni el token.
2. Subí todos los archivos de esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "PWA de gastos"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/gastos.git
   git push -u origin main
   ```
3. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. En uno o dos minutos queda en `https://TU_USUARIO.github.io/gastos/`.

## 3. Instalar en el iPhone

1. Abrí la URL de GitHub Pages en **Safari** (tiene que ser Safari).
2. **Compartir (□↑) → Agregar a inicio**.
3. Abrí la app desde el ícono. La primera vez pide la configuración: pegá la **URL `/exec`** y el **token**, y tocá **Probar y guardar**.

## Uso

- **Cargar:** monto, categoría y fecha. "Hoy" y "Ayer" son atajos, y el calendario permite cualquier día anterior. La descripción es opcional. Si cargás varios gastos seguidos, la fecha elegida se mantiene.
- **Resumen:** total del mes, total por categoría con porcentaje y lista agrupada por día. Con ‹ › cambiás de mes.
- **Editar o borrar:** tocá un gasto en el Resumen.
- **Sin señal:** el gasto se guarda en el teléfono (marcado con ●) y se sube solo al recuperar conexión o al volver a abrir la app. El indicador de arriba muestra el estado; tocalo para forzar la sincronización.

## Actualizar la app

Después de modificar archivos, cambiá `VERSION` en [`sw.js`](sw.js) (por ejemplo `gastos-v2`) y hacé push. El iPhone toma la versión nueva al cerrar y volver a abrir la app (a veces hacen falta dos aperturas).

## Probar en la PC

```bash
python -m http.server 8000
```
Abrí `http://localhost:8000`.
