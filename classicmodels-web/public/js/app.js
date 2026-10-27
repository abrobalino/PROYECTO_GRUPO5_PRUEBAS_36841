// ===========================================================================
// app.js  -  APLICACION PRINCIPAL
// ===========================================================================
// Organizado en bloques:
//   1. Arranque y sesion
//   2. Navegacion entre secciones
//   3. Utilidades para dibujar tablas
//   4. Inicio (resumen)
//   5. Clientes  (CRUD)
//   6. Productos (CRUD)
//   7. Consultas
//   8. Reportes
// ===========================================================================

const LINEAS = ['Classic Cars','Motorcycles','Planes','Ships','Trains',
                'Trucks and Buses','Vintage Cars'];

// ---------- 1. ARRANQUE Y SESION -------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  const s = await API.get('/api/auth/sesion');

  if (!s.ok) {                       // sin sesion -> volver al login
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('etiqueta-usuario').textContent =
    s.usuario.nombre + ' (' + s.usuario.rol + ')';

  llenarSelectoresDeLinea();
  cargarInicio();
});

async function cerrarSesion() {
  await API.post('/api/auth/logout');
  window.location.href = 'index.html';
}

// ---------- 2. NAVEGACION ---------------------------------------------------
document.querySelectorAll('.boton-menu').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.boton-menu').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');

    const destino = boton.dataset.seccion;
    document.querySelectorAll('.seccion').forEach(s => s.classList.add('oculto'));
    document.getElementById(destino).classList.remove('oculto');

    if (destino === 'inicio')    cargarInicio();
    if (destino === 'clientes')  cargarClientes();
    if (destino === 'productos') cargarProductos();
    if (destino === 'reportes')  cargarReporte('por-cliente');
  });
});

// ---------- 3. UTILIDADES DE TABLA ------------------------------------------
// Dibuja una tabla a partir de un arreglo de objetos. Las columnas se deducen
// de las claves del primer registro, asi la misma funcion sirve para todas las
// consultas y reportes.
function dibujarTabla(destino, filas, acciones = null) {
  const caja = document.getElementById(destino);

  if (!filas || filas.length === 0) {
    caja.innerHTML = '<p class="sin-datos">No se encontraron registros</p>';
    return;
  }

  const columnas = Object.keys(filas[0]);

  let html = '<table><thead><tr>';
  columnas.forEach(c => html += '<th>' + c.replace(/_/g, ' ') + '</th>');
  if (acciones) html += '<th>Acciones</th>';
  html += '</tr></thead><tbody>';

  filas.forEach(fila => {
    html += '<tr>';
    columnas.forEach(c => {
      const v = fila[c];
      const esNumero = typeof v === 'number';
      html += '<td class="' + (esNumero ? 'numero' : '') + '">' + formatear(v, c) + '</td>';
    });
    if (acciones) html += '<td>' + acciones(fila) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  caja.innerHTML = '<p class="contador">' + filas.length + ' registro(s)</p>' + html;
}

// Da formato a los valores segun su tipo o el nombre de la columna
function formatear(valor, columna) {
  if (valor === null || valor === undefined || valor === '') return '-';

  // Fechas: llegan como texto ISO desde el JSON
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
    return new Date(valor).toLocaleDateString('es-EC');
  }

  // Etiquetas de color para las columnas de estado
  const c = columna.toUpperCase();
  if (c === 'NIVEL_ALERTA' || c === 'SITUACION') {
    const clase = ['AGOTADO','CRITICO','EXCEDE CREDITO'].includes(valor) ? 'et-rojo'
                : ['BAJO','CON SALDO'].includes(valor)                    ? 'et-ambar'
                : 'et-verde';
    return '<span class="etiqueta ' + clase + '">' + valor + '</span>';
  }

  if (typeof valor === 'number' && !Number.isInteger(valor)) {
    return valor.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return valor;
}

function llenarSelectoresDeLinea() {
  const opciones = LINEAS.map(l => '<option value="' + l + '">' + l + '</option>').join('');
  document.getElementById('pro-linea').innerHTML = opciones;
  document.getElementById('filtro-linea').innerHTML =
    '<option value="">Todas las lineas</option>' + opciones;
}

// ---------- 4. INICIO -------------------------------------------------------
async function cargarInicio() {
  const [clientes, productos, stock, oficinas] = await Promise.all([
    API.get('/api/clientes'),
    API.get('/api/productos'),
    API.get('/api/reportes/vista/stock-critico'),
    API.get('/api/reportes/vista/por-oficina')
  ]);

  const totalVentas = (oficinas.datos || [])
    .reduce((suma, o) => suma + Number(o.TOTAL_VENTAS || 0), 0);

  const tarjetas = [
    { etiqueta: 'Clientes',        valor: (clientes.datos  || []).length },
    { etiqueta: 'Productos',       valor: (productos.datos || []).length },
    { etiqueta: 'Stock bajo',      valor: (stock.datos     || []).length },
    { etiqueta: 'Ventas totales',  valor: '$' + Math.round(totalVentas).toLocaleString('es-EC') }
  ];

  document.getElementById('tarjetas-resumen').innerHTML = tarjetas.map(t =>
    '<div class="tarjeta"><div class="valor">' + t.valor + '</div>' +
    '<div class="etiqueta">' + t.etiqueta + '</div></div>').join('');

  dibujarTabla('tabla-inicio', oficinas.datos);
}

// ---------- 5. CLIENTES -----------------------------------------------------
async function cargarClientes() {
  const busqueda = document.getElementById('buscar-cliente').value.trim();
  const r = await API.get('/api/clientes' + (busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  dibujarTabla('tabla-clientes', r.datos, fila =>
    '<button class="boton-mini" onclick="editarCliente(' + fila.CODIGO + ')">Editar</button>' +
    '<button class="boton-mini boton-borrar" onclick="eliminarCliente(' + fila.CODIGO + ')">Borrar</button>');

  window._clientes = r.datos;
}

function abrirFormularioCliente() {
  document.getElementById('titulo-formulario-cliente').textContent = 'Nuevo cliente';
  ['cli-codigo','cli-nombre','cli-contactoNom','cli-contactoApe','cli-telefono',
   'cli-direccion','cli-ciudad','cli-pais','cli-vendedor']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('cli-limite').value = 0;
  document.getElementById('formulario-cliente').classList.remove('oculto');
}

function cerrarFormularioCliente() {
  document.getElementById('formulario-cliente').classList.add('oculto');
}

function editarCliente(codigo) {
  const c = (window._clientes || []).find(x => x.CODIGO === codigo);
  if (!c) return;

  document.getElementById('titulo-formulario-cliente').textContent = 'Editar cliente ' + codigo;
  document.getElementById('cli-codigo').value       = c.CODIGO;
  document.getElementById('cli-nombre').value       = c.NOMBRE || '';
  document.getElementById('cli-telefono').value     = c.TELEFONO || '';
  document.getElementById('cli-ciudad').value       = c.CIUDAD || '';
  document.getElementById('cli-pais').value         = c.PAIS || '';
  document.getElementById('cli-vendedor').value     = c.CODIGO_VENDEDOR || '';
  document.getElementById('cli-limite').value       = c.LIMITE_CREDITO || 0;

  const contacto = (c.CONTACTO || '').split(' ');
  document.getElementById('cli-contactoNom').value = contacto[0] || '';
  document.getElementById('cli-contactoApe').value = contacto.slice(1).join(' ');
  document.getElementById('cli-direccion').value   = '';

  document.getElementById('formulario-cliente').classList.remove('oculto');
  window.scrollTo(0, 0);
}

async function guardarCliente() {
  const v = id => document.getElementById(id).value.trim();

  const datos = {
    nombre:      v('cli-nombre'),
    contactoNom: v('cli-contactoNom'),
    contactoApe: v('cli-contactoApe'),
    telefono:    v('cli-telefono'),
    direccion:   v('cli-direccion'),
    ciudad:      v('cli-ciudad'),
    pais:        v('cli-pais'),
    vendedor:    v('cli-vendedor') || null,
    limite:      v('cli-limite') || 0
  };

  const codigo = v('cli-codigo');
  const r = codigo
    ? await API.put('/api/clientes/' + codigo, datos)
    : await API.post('/api/clientes', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioCliente();
  cargarClientes();
}

async function eliminarCliente(codigo) {
  if (!confirm('Eliminar el cliente ' + codigo + '?')) return;

  const r = await API.borrar('/api/clientes/' + codigo);

  if (!r.ok) return avisar(r.mensaje, true);   // aqui aparece el error del trigger
  avisar(r.mensaje);
  cargarClientes();
}

// ---------- 6. PRODUCTOS ----------------------------------------------------
async function cargarProductos() {
  const busqueda = document.getElementById('buscar-producto').value.trim();
  const linea    = document.getElementById('filtro-linea').value;

  const parametros = [];
  if (busqueda) parametros.push('busqueda=' + encodeURIComponent(busqueda));
  if (linea)    parametros.push('linea='    + encodeURIComponent(linea));

  const r = await API.get('/api/productos' + (parametros.length ? '?' + parametros.join('&') : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  dibujarTabla('tabla-productos', r.datos, fila =>
    '<button class="boton-mini" onclick="editarProducto(\'' + fila.CODIGO + '\')">Editar</button>' +
    '<button class="boton-mini boton-borrar" onclick="eliminarProducto(\'' + fila.CODIGO + '\')">Borrar</button>');

  window._productos = r.datos;
}

function abrirFormularioProducto() {
  document.getElementById('titulo-formulario-producto').textContent = 'Nuevo producto';
  ['pro-codigo','pro-nombre','pro-escala','pro-proveedor','pro-descripcion',
   'pro-precioCompra','pro-precioVenta'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pro-stock').value = 0;
  document.getElementById('pro-codigo').disabled = false;
  document.getElementById('formulario-producto').classList.remove('oculto');
}

function cerrarFormularioProducto() {
  document.getElementById('formulario-producto').classList.add('oculto');
}

function editarProducto(codigo) {
  const p = (window._productos || []).find(x => x.CODIGO === codigo);
  if (!p) return;

  document.getElementById('titulo-formulario-producto').textContent = 'Editar producto ' + codigo;
  document.getElementById('pro-codigo').value        = p.CODIGO;
  document.getElementById('pro-codigo').disabled     = true;      // la clave no se cambia
  document.getElementById('pro-nombre').value        = p.NOMBRE || '';
  document.getElementById('pro-linea').value         = p.LINEA || '';
  document.getElementById('pro-escala').value        = p.ESCALA || '';
  document.getElementById('pro-proveedor').value     = p.PROVEEDOR || '';
  document.getElementById('pro-stock').value         = p.STOCK ?? 0;
  document.getElementById('pro-precioCompra').value  = p.PRECIO_COMPRA ?? '';
  document.getElementById('pro-precioVenta').value   = p.PRECIO_VENTA ?? '';

  document.getElementById('formulario-producto').classList.remove('oculto');
  window.scrollTo(0, 0);
}

async function guardarProducto() {
  const v = id => document.getElementById(id).value.trim();
  const editando = document.getElementById('pro-codigo').disabled;

  const datos = {
    codigo:       v('pro-codigo'),
    nombre:       v('pro-nombre'),
    linea:        v('pro-linea'),
    escala:       v('pro-escala'),
    proveedor:    v('pro-proveedor'),
    descripcion:  v('pro-descripcion'),
    stock:        v('pro-stock'),
    precioCompra: v('pro-precioCompra'),
    precioVenta:  v('pro-precioVenta')
  };

  const r = editando
    ? await API.put('/api/productos/' + datos.codigo, datos)
    : await API.post('/api/productos', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioProducto();
  cargarProductos();
}

async function eliminarProducto(codigo) {
  if (!confirm('Eliminar el producto ' + codigo + '?')) return;

  const r = await API.borrar('/api/productos/' + codigo);

  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarProductos();
}

// ---------- 7. CONSULTAS ----------------------------------------------------
async function consultarVentasCliente() {
  const codigo = document.getElementById('consulta-cliente').value.trim();
  const r = await API.get('/api/reportes/ventas-cliente' + (codigo ? '?codigo=' + codigo : ''));

  if (!r.ok) return avisar(r.mensaje, true);
  dibujarTabla('tabla-consulta-cliente', r.datos);
}

async function consultarVentasFechas() {
  const desde = document.getElementById('consulta-desde').value;
  const hasta = document.getElementById('consulta-hasta').value;

  if (!desde || !hasta) return avisar('Indique ambas fechas', true);

  const r = await API.get('/api/reportes/ventas-fechas?desde=' + desde + '&hasta=' + hasta);

  if (!r.ok) return avisar(r.mensaje, true);
  dibujarTabla('tabla-consulta-fechas', r.datos);
}

// ---------- 8. REPORTES -----------------------------------------------------
const ORIGEN_VISTA = {
  'por-cliente':   'Vista: V_VENTAS_POR_CLIENTE',
  'por-periodo':   'Vista: V_VENTAS_POR_PERIODO',
  'top-productos': 'Vista: V_TOP_PRODUCTOS',
  'stock-critico': 'Vista: V_STOCK_CRITICO',
  'por-oficina':   'Vista: V_VENTAS_POR_OFICINA',
  'estado-cuenta': 'Vista: V_ESTADO_CUENTA',
  'auditoria':     'Tabla: AUDITORIA (alimentada por los triggers)'
};

document.querySelectorAll('.boton-reporte').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.boton-reporte').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');
    cargarReporte(boton.dataset.vista);
  });
});

async function cargarReporte(nombre) {
  document.getElementById('vista-origen').textContent = ORIGEN_VISTA[nombre] || '';

  const r = await API.get('/api/reportes/vista/' + nombre);

  if (!r.ok) return avisar(r.mensaje, true);
  dibujarTabla('tabla-reporte', r.datos);
}
