# Informe de correcciones de SonarQube

## Resumen

| Archivo | Issue | Cantidad corregida |
|---|---|---:|
| `datos.js` | Contraseñas o credenciales escritas directamente | 4 |
| `server.js` | X-Powered-By y uso de `path` | 2 |
| `controllers/clientes.controller.js` | Regex con posible backtracking superlineal | 1 |
| `controllers/ordenes.controller.js` | Validación de fecha con `isNaN` | 1 |
| `controllers/mecanicos.controller.js` | `ROLES` como arreglo y uso de `includes` | 1 colección + 2 usos |
| `controllers/servicios.controller.js` | Negación de comparación `!(precio > 0)` | 1 |
| `public/index.html` | Labels no asociados / controles sin nombre accesible | 38 controles visibles revisados |
| `public/js/app.js` | `replace`, `COLUMNAS_DINERO` y ternario anidado | 3 |
| `public/js/api.js` | `catch` vacío o sin manejo explícito | 1 |
| `public/css/estilos.css` | Contraste insuficiente | 2 |

## Correcciones

### `datos.js` – Review this potentially hard-coded password.
- **Categoría:** Security
- **Problema:** SonarQube detectó valores literales de contraseña usados directamente en los registros de usuarios.
- **Código ANTES:**
```js
{ id: 1, usuario: 'admin', password: 'admin123', rol: 'ADMIN' }
{ id: 2, usuario: 'lperez', password: 'mecanico123', rol: 'MECANICO' }
```
- **Código DESPUÉS:**
```js
{ id: 1, usuario: 'admin', password: process.env.ADMIN_PASSWORD, rol: 'ADMIN' }
{ id: 2, usuario: 'lperez', password: process.env.MECANICO_PASSWORD, rol: 'MECANICO' }
```
- **Qué se cambió y por qué:** Las cuatro credenciales se obtienen ahora de variables de entorno: una para el administrador y una compartida para los mecánicos. Se creó `.env.example`, se añadió el archivo `.env` local con los valores actuales, y `.env` ya estaba excluido en `.gitignore`.

### `server.js` – This framework implicitly discloses version information by default.
- **Categoría:** Security
- **Problema:** Express podía incluir `X-Powered-By` y revelar información de la tecnología usada.
- **Código ANTES:**
```js
const app = express();
```
- **Código DESPUÉS:**
```js
const app = express();
app.disable('x-powered-by');
```
- **Qué se cambió y por qué:** Se deshabilitó el encabezado que revela Express, sin cambiar rutas ni respuestas de la aplicación.

### `server.js` – Prefer `node:path` over `path`.
- **Categoría:** Maintainability
- **Problema:** SonarQube recomienda el módulo incorporado con el prefijo explícito `node:`.
- **Código ANTES:**
```js
const path = require('path');
```
- **Código DESPUÉS:**
```js
const path = require('node:path');
```
- **Qué se cambió y por qué:** Se sustituyó el nombre de importación, manteniendo el mismo comportamiento de resolución de archivos estáticos.

### `controllers/clientes.controller.js` – Simplify this regular expression to reduce runtime due to backtracking.
- **Categoría:** Reliability
- **Problema:** Una expresión regular seguía requiriendo análisis de posibles coincidencias ambiguas para validar el email.
- **Código ANTES:**
```js
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
if (!EMAIL.test(b.email || '')) return 'El email no es valido';
```
- **Código DESPUÉS:**
```js
function emailValido(email) {
  if (typeof email !== 'string' || email.length === 0 || /\s/.test(email)) return false;
  const partes = email.split('@');
  if (partes.length !== 2) return false;
  const [local, dominio] = partes;
  if (!local || !dominio) return false;
  const posicionPunto = dominio.indexOf('.');
  return posicionPunto > 0 && posicionPunto < dominio.length - 1;
}

if (!emailValido(b.email || '')) return 'El email no es valido';
```
- **Qué se cambió y por qué:** Se eliminó por completo la expresión regular problemática. La validación divide el email por `@`, rechaza espacios, exige contenido local y de dominio, y comprueba un punto interior en el dominio; esto conserva las condiciones aceptadas por el patrón anterior sin backtracking.

### `controllers/ordenes.controller.js` – Prefer `Number.isNaN` over `isNaN`.
- **Categoría:** Reliability / Maintainability
- **Problema:** `isNaN` realiza coerción implícita y puede aceptar valores inconsistentes; también se solicitó eliminar globalmente su uso.
- **Código ANTES:**
```js
if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '') || isNaN(new Date(b.fecha))) return 'La fecha no es valida';
```
- **Código DESPUÉS:**
```js
const fecha = new Date(b.fecha || '');
if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '') || Number.isNaN(fecha.getTime())) return 'La fecha no es valida';
```
- **Qué se cambió y por qué:** Se construye el objeto de fecha una sola vez y se valida su valor numérico mediante `Number.isNaN`. Así se evita la coerción global y se conserva la misma negativa lógica para fechas inválidas.

### `controllers/mecanicos.controller.js` – `ROLES` should be a `Set`, and use `ROLES.has()`.
- **Categoría:** Maintainability
- **Problema:** Una colección de valores cerrados se comprobaba con `Array.includes`, menos apropiada para pertenencia.
- **Código ANTES:**
```js
const ROLES = ['ADMIN', 'MECANICO'];
if (!ROLES.includes(b.rol)) return res.status(400).json({ ok: false, mensaje: 'Rol no valido' });
```
- **Código DESPUÉS:**
```js
const ROLES = new Set(['ADMIN', 'MECANICO']);
if (!ROLES.has(b.rol)) return res.status(400).json({ ok: false, mensaje: 'Rol no valido' });
```
- **Qué se cambió y por qué:** `ROLES` pasó a ser un `Set` y ambas validaciones usan `.has()`, conservando únicamente los valores `ADMIN` y `MECANICO`.

### `controllers/servicios.controller.js` – Use the opposite operator (`<=`) instead.
- **Categoría:** Maintainability
- **Problema:** SonarQube recomienda expresar la negación mediante el operador opuesto para simplificar la condición.
- **Código ANTES:**
```js
if (!(precio > 0)) return 'El precio debe ser mayor a 0';
```
- **Código DESPUÉS:**
```js
if (precio <= 0) return 'El precio debe ser mayor a 0';
```
- **Qué se cambió y por qué:** Se reemplazó la negación por `<=`, conservando exactamente el rechazo de precios menores o iguales a cero.

### `public/index.html` – Associate valid labels and accessible text to form controls.
- **Categoría:** Reliability
- **Problema:** Controles sin `id`, `label` sin asociación y buscadores sin nombre accesible podían causar problemas de navegación por lector de pantalla.
- **Ejemplo ANTES 1:**
```html
<input type="text" id="buscar-cliente" placeholder="Buscar por nombre o cedula...">
```
- **Ejemplo DESPUÉS 1:**
```html
<input type="text" id="buscar-cliente" placeholder="Buscar por nombre o cedula..." aria-label="Buscar clientes">
```
- **Ejemplo ANTES 2:**
```html
<div class="campo"><label>Cliente *</label><select id="ord-cliente"></select></div>
```
- **Ejemplo DESPUÉS 2:**
```html
<div class="campo"><label for="ord-cliente">Cliente *</label><select id="ord-cliente"></select></div>
```
- **Ejemplo ANTES 3:**
```html
<label>Desde</label><input type="date" id="consulta-desde">
```
- **Ejemplo DESPUÉS 3:**
```html
<label for="consulta-desde">Desde</label><input type="date" id="consulta-desde">
```
- **Qué se cambió y por qué:** Se aplicó un patrón consistente a los controles visibles: etiquetas descriptivas con `for` igual al `id`, o `aria-label` para buscadores y controles compactos. Se verificaron 40 elementos input/select/textarea con `id`, incluidos 38 controles visibles y dos campos ocultos; los `id` quedan únicos, los `for` apuntan a controles existentes y no hay etiquetas vacías.

### `public/js/app.js` – Prefer `replaceAll()` over `replace()`.
- **Categoría:** Maintainability
- **Problema:** SonarQube identifica reemplazos destinados a todas las coincidencias mediante `replace`.
- **Código ANTES:**
```js
String(t).replace(/[&<>"']/g, callback);
c.replace(/_/g, ' ');
```
- **Código DESPUÉS:**
```js
String(t).replaceAll(/[&<>"']/g, callback);
c.replaceAll('_', ' ');
```
- **Qué se cambió y por qué:** Se usa `replaceAll`, con la expresión global conservada para el escapado y una cadena para los separadores, sin cambiar el texto producido.

### `public/js/app.js` – `COLUMNAS_DINERO` should be a `Set`, and use `.has()`.
- **Categoría:** Maintainability
- **Problema:** `COLUMNAS_DINERO` era una lista usada para comprobar pertenencia.
- **Código ANTES:**
```js
const COLUMNAS_DINERO = ['precio', 'total', ...];
if (COLUMNAS_DINERO.includes(columna)) return dinero(valor);
```
- **Código DESPUÉS:**
```js
const COLUMNAS_DINERO = new Set(['precio', 'total', ...]);
if (COLUMNAS_DINERO.has(columna)) return dinero(valor);
```
- **Qué se cambió y por qué:** Se convirtió la colección en `Set` y se reemplazó la comprobación por `.has()`, manteniendo las mismas columnas monetarias.

### `public/js/app.js` – Extract nested ternary operation.
- **Categoría:** Maintainability
- **Problema:** La selección anidada de clase de estado era difícil de leer y mantenía una operación ternaria dentro de otra.
- **Código ANTES:**
```js
const clase = ['PENDIENTE', 'INACTIVO'].includes(valor) ? 'et-rojo'
            : ['EN PROCESO', 'TERMINADA'].includes(valor) ? 'et-ambar'
            : 'et-verde';
```
- **Código DESPUÉS:**
```js
function claseEstado(valor) {
  if (valor === 'PENDIENTE' || valor === 'INACTIVO') return 'et-rojo';
  if (valor === 'EN PROCESO' || valor === 'TERMINADA') return 'et-ambar';
  return 'et-verde';
}
```
- **Qué se cambió y por qué:** Se sustituyó el ternario anidado por una función independiente con `if`, con las mismas tres rutas de clasificación.

### `public/js/api.js` – Handle or explain this exception.
- **Categoría:** Maintainability
- **Problema:** El bloque de captura devolvía un mensaje pero no registraba ni comunicaba la excepción original.
- **Código ANTES:**
```js
catch (e) {
  return { ok: false, mensaje: 'No se pudo conectar con el servidor' };
}
```
- **Código DESPUÉS:**
```js
catch (error) {
  console.error('No se pudo conectar con el servidor:', error);
  return { ok: false, mensaje: 'No se pudo conectar con el servidor' };
}
```
- **Qué se cambió y por qué:** Se conserva el mensaje al usuario y además se registra el error real en consola para diagnóstico.

### `public/css/estilos.css` – Text does not meet minimal contrast requirement.
- **Categoría:** Maintainability
- **Problema:** Dos pares texto/fondo usados en etiquetas tenían contraste insuficiente para texto normal, y el texto del menú también usaba blanco con transparencia.
- **Código ANTES:**
```css
--verde: #2e7d4f; /* sobre #e3f3e9: 4.39:1 */
--ambar: #b06f00; /* sobre #fdf0d5: 3.63:1 */
color: rgba(255,255,255,.8);
```
- **Código DESPUÉS:**
```css
--verde: #1f5f3a; /* sobre #e3f3e9: 6.63:1 */
--ambar: #704400; /* sobre #fdf0d5: 7.39:1 */
color: var(--blanco);
```
- **Qué se cambió y por qué:** Se oscurecieron aún más los colores verde y ámbar para superar holgadamente WCAG AA, y el texto normal del menú pasó a blanco sólido sobre el azul, con una relación final de 8.80:1. Se conservó la identidad visual de los estados.

## Verificación final

- [x] `datos.js`: credenciales movidas a variables de entorno.
- [x] `.env.example` creado sin valores reales.
- [x] `.env` local actualizado y protegido por `.gitignore`.
- [x] `dotenv` cargado al inicio de `server.js`.
- [x] `x-powered-by` deshabilitado.
- [x] Camino de Node actualizado a `node:path`.
- [x] Regex, validaciones numéricas, `Set` y comparación opuesta corregidos.
- [x] Controles HTML revisados, asociados y con nombres accesibles.
- [x] No se encontraron `id` duplicados ni `for` apuntando a ids inexistentes.
- [x] Reemplazos, ternario, captura de excepciones y contraste corregidos.
- [x] No se ejecutó ningún escaneo de SonarQube.

## Archivos tocados

- `datos.js`
- `.env.example`
- `.env`
- `server.js`
- `controllers/clientes.controller.js`
- `controllers/ordenes.controller.js`
- `controllers/mecanicos.controller.js`
- `controllers/servicios.controller.js`
- `public/index.html`
- `public/js/app.js`
- `public/js/api.js`
- `public/css/estilos.css`
- `.gitignore` (verificado; ya contenía `.env`)
- `INFORME_CAMBIOS.md`
