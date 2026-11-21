# Historial de versiones

Cada versión publicada tiene una etiqueta en git (`v1`, `v2`, …), una página en
[Releases](https://github.com/joserossi/app-gastos/releases) y capturas en `historial/<versión>/`.
Las capturas usan datos de ejemplo, no gastos reales.

Para recuperar el código de una versión: `git checkout v1` (y `git checkout main` para volver).

---

## v2 · desde el 20 de noviembre de 2026

Rediseño de la interfaz.

- Categorías en una grilla de 4 con íconos propios y un color para cada una; las no elegidas se atenúan.
- Fecha con un selector Hoy · Ayer · Otro día y la fecha completa debajo.
- Botón Guardar fijo abajo, siempre visible, que muestra el monto ("Guardar $ 12.500").
- Al editar: borrar, Cancelar y Guardar cambios en la misma barra.
- Resumen con promedio por día y comparación con el mes anterior al mismo día.
- Barras por categoría en el verde de la app, con el ícono de color de cada categoría.
- Lista de gastos más compacta.
- Indicador de estado reducido a un punto de color (verde, ámbar con pendientes, rojo si falta configurar).

| | Cargar | Resumen |
|---|---|---|
| Claro | ![](v2/1-cargar-claro.png) | ![](v2/2-resumen-claro.png) |
| Oscuro | ![](v2/1-cargar-oscuro.png) | ![](v2/2-resumen-oscuro.png) |

---

## v1 · 10 al 20 de noviembre de 2026

Primera versión en uso.

- Carga de gastos con monto, categoría, fecha (hoy, ayer o cualquier día anterior) y descripción opcional.
- Monto con separador de miles mientras se escribe y botón × para borrarlo.
- Siete categorías: Restaurant, Alimentación, Salud, Casa, Familia, Transporte y Ocio, con emojis.
- Resumen del mes: total, barras por categoría con porcentaje y lista de gastos agrupada por día.
- Tocar una categoría del resumen filtra la lista; la × del encabezado quita el filtro.
- Edición y borrado tocando un gasto.
- Uso sin conexión: los gastos quedan pendientes y se suben solos.
- Ícono con el signo $ grande y semitransparente.

| | Cargar | Resumen |
|---|---|---|
| Claro | ![](v1/1-cargar-claro.png) | ![](v1/2-resumen-claro.png) |
| Oscuro | ![](v1/1-cargar-oscuro.png) | ![](v1/2-resumen-oscuro.png) |
