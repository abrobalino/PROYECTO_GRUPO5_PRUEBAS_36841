// ===========================================================================
// app.js  -  APLICACION PRINCIPAL
// ===========================================================================
// Organizado en bloques:
//   1. Arranque
//   2. Navegacion entre secciones
//   3. Utilidades para dibujar tablas
//   4. Inicio (resumen)
//   5. Ordenes de trabajo (CRUD con detalle)
//   6. Clientes  (CRUD)
//   7. Vehiculos (CRUD)
//   8. Servicios (CRUD)
//   9. Mecanicos (CRUD)
//  10. Consultas
// ===========================================================================

// ---------- 1. ARRANQUE -----------------------------------------------------
// No hay inicio de sesion: la aplicacion abre directamente en el panel.
document.addEventListener('DOMContentLoaded', cargarInicio);

// ---------- 2. NAVEGACION ---------------------------------------------------
document.querySelectorAll('.boton-menu').forEach(boton => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.boton-menu').forEach(b => b.classList.remove('activo'));
    boton.classList.add('activo');

    const destino = boton.dataset.seccion;
    document.querySelectorAll('.seccion').forEach(s => s.classList.add('oculto'));
    document.getElementById(destino).classList.remove('oculto');

    if (destino === 'inicio')    cargarInicio();
    if (destino === 'ordenes')   cargarOrdenes();
    if (destino === 'clientes')  cargarClientes();
    if (destino === 'vehiculos') cargarVehiculos();
    if (destino === 'servicios') cargarServicios();
    if (destino === 'mecanicos') cargarMecanicos();
  });
});

// ---------- 3. UTILIDADES DE TABLA ------------------------------------------
// Evita que un texto con < o " rompa el HTML
function escapar(t) {
  return String(t).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const dinero = n => '$' + Number(n || 0).toLocaleString('es-EC',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Dibuja una tabla a partir de un arreglo de objetos. Las columnas se deducen
// de las claves del primer registro, asi la misma funcion sirve para todas las
// pantallas y consultas.
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
    if (acciones) html += '<td class="acciones">' + acciones(fila) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  caja.innerHTML = '<p class="contador">' + filas.length + ' registro(s)</p>' + html;
}

// Columnas que se muestran como dinero
const COLUMNAS_DINERO = ['precio', 'total', 'monto', 'ingresos', 'total_facturado', 'subtotal'];

// Da formato a los valores segun su tipo o el nombre de la columna
function formatear(valor, columna) {
  if (valor === null || valor === undefined || valor === '') return '-';

  // Etiquetas de color para las columnas de estado
  if (columna === 'estado') {
    const clase = ['PENDIENTE', 'INACTIVO'].includes(valor) ? 'et-rojo'
                : ['EN PROCESO', 'TERMINADA'].includes(valor) ? 'et-ambar'
                : 'et-verde';
    return '<span class="etiqueta ' + clase + '">' + escapar(valor) + '</span>';
  }

  if (COLUMNAS_DINERO.includes(columna)) return dinero(valor);
  return escapar(valor);
}

// Llena un <select> con opciones { valor, texto }
function llenarSelect(id, opciones, vacio = null) {
  document.getElementById(id).innerHTML =
    (vacio ? '<option value="">' + vacio + '</option>' : '') +
    opciones.map(o => '<option value="' + escapar(o.valor) + '">' + escapar(o.texto) + '</option>').join('');
}

const botones = (editar, borrar, clave) =>
  '<button class="boton-mini" onclick="' + editar + '(\'' + clave + '\')">Editar</button>' +
  '<button class="boton-mini boton-borrar" onclick="' + borrar + '(\'' + clave + '\')">Borrar</button>';

const valor = id => document.getElementById(id).value.trim();

function mostrarFormulario(id) {
  document.getElementById(id).classList.remove('oculto');
  window.scrollTo(0, 0);
}

// ---------- 4. INICIO -------------------------------------------------------
async function cargarInicio() {
  const [clientes, vehiculos, ordenes] = await Promise.all([
    API.get('/api/clientes'),
    API.get('/api/vehiculos'),
    API.get('/api/ordenes')
  ]);

  // Ordenes sin entregar, de la mas antigua a la mas reciente
  const pendientes = (ordenes.datos || [])
    .filter(o => o.estado !== 'ENTREGADA')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(o => ({
      numero: o.numero, fecha: o.fecha, placa: o.placa, vehiculo: o.vehiculo,
      cliente: o.cliente, mecanico: o.mecanico, estado: o.estado, total: o.total
    }));

  const facturado = (ordenes.datos || [])
    .filter(o => o.estado === 'ENTREGADA')
    .reduce((suma, o) => suma + o.total, 0);

  const tarjetas = [
    { etiqueta: 'Clientes',          valor: (clientes.datos   || []).length },
    { etiqueta: 'Vehiculos',         valor: (vehiculos.datos  || []).length },
    { etiqueta: 'Ordenes abiertas',  valor: pendientes.length },
    { etiqueta: 'Facturado (entregadas)', valor: dinero(facturado) }
  ];

  document.getElementById('tarjetas-resumen').innerHTML = tarjetas.map(t =>
    '<div class="tarjeta"><div class="valor">' + t.valor + '</div>' +
    '<div class="etiqueta">' + t.etiqueta + '</div></div>').join('');

  dibujarTabla('tabla-inicio', pendientes);
}

// ---------- 5. ORDENES DE TRABAJO -------------------------------------------
// Mientras se edita, el detalle vive en este arreglo y se dibuja en pantalla.
let detalleEnEdicion = [];
let catalogo = { clientes: [], vehiculos: [], mecanicos: [], servicios: [] };

async function cargarOrdenes() {
  const busqueda = valor('buscar-orden');
  const estado   = valor('filtro-estado');

  const parametros = [];
  if (busqueda) parametros.push('busqueda=' + encodeURIComponent(busqueda));
  if (estado)   parametros.push('estado='   + encodeURIComponent(estado));

  const r = await API.get('/api/ordenes' + (parametros.length ? '?' + parametros.join('&') : ''));
  if (!r.ok) return avisar(r.mensaje, true);

  window._ordenes = r.datos;

  const filas = r.datos.map(o => ({
    numero: o.numero, fecha: o.fecha, placa: o.placa, vehiculo: o.vehiculo,
    cliente: o.cliente, mecanico: o.mecanico,
    servicios: o.detalle.map(d => d.nombre + (d.cantidad > 1 ? ' x' + d.cantidad : '')).join(', '),
    estado: o.estado, total: o.total
  }));

  dibujarTabla('tabla-ordenes', filas, f =>
    f.estado === 'ENTREGADA' ? '<span class="ayuda">Cerrada</span>' : botones('editarOrden', 'eliminarOrden', f.numero));
}

// Trae clientes, vehiculos, mecanicos activos y servicios para los selects
async function cargarCatalogoOrden() {
  const [c, v, m, s] = await Promise.all([
    API.get('/api/clientes'), API.get('/api/vehiculos'),
    API.get('/api/mecanicos'), API.get('/api/servicios')
  ]);
  catalogo = { clientes: c.datos || [], vehiculos: v.datos || [], mecanicos: m.datos || [], servicios: s.datos || [] };

  llenarSelect('ord-cliente', catalogo.clientes.map(x => ({ valor: x.cedula, texto: x.nombres + ' - ' + x.cedula })), 'Seleccione...');
  llenarSelect('ord-servicio', catalogo.servicios.map(x => ({ valor: x.codigo, texto: x.nombre + ' (' + dinero(x.precio) + ')' })));
}

// mecanicoActual se incluye aunque este inactivo, para no perderlo al editar
function llenarMecanicos(mecanicoActual = null) {
  llenarSelect('ord-mecanico', catalogo.mecanicos
    .filter(m => m.activo || m.id === mecanicoActual)
    .map(m => ({ valor: m.id, texto: m.nombres + ' - ' + m.especialidad })));
}

function llenarVehiculosDeCliente(placa = null) {
  const cedula = valor('ord-cliente');
  const propios = catalogo.vehiculos.filter(v => v.cedulaCliente === cedula);
  llenarSelect('ord-placa', propios.map(v => ({ valor: v.placa, texto: v.placa + ' - ' + v.marca + ' ' + v.modelo })),
               propios.length ? null : 'El cliente no tiene vehiculos');
  if (placa) document.getElementById('ord-placa').value = placa;
}

async function abrirFormularioOrden() {
  await cargarCatalogoOrden();
  llenarMecanicos();
  document.getElementById('titulo-formulario-orden').textContent = 'Nueva orden';
  document.getElementById('ord-numero').value        = '';
  document.getElementById('ord-cliente').value       = '';
  document.getElementById('ord-fecha').value         = new Date().toISOString().slice(0, 10);
  document.getElementById('ord-estado').value        = 'PENDIENTE';
  document.getElementById('ord-observaciones').value = '';
  document.getElementById('ord-cantidad').value      = 1;
  llenarVehiculosDeCliente();
  detalleEnEdicion = [];
  dibujarDetalle();
  mostrarFormulario('formulario-orden');
}

function cerrarFormularioOrden() {
  document.getElementById('formulario-orden').classList.add('oculto');
}

async function editarOrden(numero) {
  const o = (window._ordenes || []).find(x => x.numero === Number(numero));
  if (!o) return;

  await cargarCatalogoOrden();
  llenarMecanicos(o.mecanicoId);
  document.getElementById('titulo-formulario-orden').textContent = 'Editar orden ' + o.numero;
  document.getElementById('ord-numero').value        = o.numero;
  document.getElementById('ord-cliente').value       = o.cedulaCliente;
  llenarVehiculosDeCliente(o.placa);
  document.getElementById('ord-mecanico').value      = o.mecanicoId;
  document.getElementById('ord-fecha').value         = o.fecha;
  document.getElementById('ord-estado').value        = o.estado;
  document.getElementById('ord-observaciones').value = o.observaciones || '';

  detalleEnEdicion = o.detalle.map(d => ({ ...d }));
  dibujarDetalle();
  mostrarFormulario('formulario-orden');
}

function agregarLineaOrden() {
  const codigo   = valor('ord-servicio');
  const cantidad = Number(valor('ord-cantidad'));
  const s = catalogo.servicios.find(x => x.codigo === codigo);

  if (!s) return avisar('Seleccione un servicio', true);
  if (!Number.isInteger(cantidad) || cantidad < 1) return avisar('La cantidad debe ser un entero mayor a 0', true);

  const existente = detalleEnEdicion.find(d => d.codigoServicio === codigo);
  if (existente) existente.cantidad += cantidad;
  else detalleEnEdicion.push({ codigoServicio: s.codigo, nombre: s.nombre, precio: s.precio, cantidad });

  document.getElementById('ord-cantidad').value = 1;
  dibujarDetalle();
}

function quitarLineaOrden(codigo) {
  detalleEnEdicion = detalleEnEdicion.filter(d => d.codigoServicio !== codigo);
  dibujarDetalle();
}

function dibujarDetalle() {
  const filas = detalleEnEdicion.map(d => ({
    codigo: d.codigoServicio, servicio: d.nombre, precio: d.precio,
    cantidad: d.cantidad, subtotal: d.precio * d.cantidad
  }));
  dibujarTabla('detalle-orden', filas, f =>
    '<button class="boton-mini boton-borrar" onclick="quitarLineaOrden(\'' + f.codigo + '\')">Quitar</button>');

  const total = filas.reduce((s, f) => s + f.subtotal, 0);
  document.getElementById('ord-total').textContent = dinero(total);
}

async function guardarOrden() {
  if (!valor('ord-placa')) return avisar('Seleccione un cliente con vehiculo', true);

  const datos = {
    placa:         valor('ord-placa'),
    mecanicoId:    Number(valor('ord-mecanico')),
    fecha:         valor('ord-fecha'),
    estado:        valor('ord-estado'),
    observaciones: valor('ord-observaciones'),
    detalle:       detalleEnEdicion.map(d => ({ codigoServicio: d.codigoServicio, cantidad: d.cantidad }))
  };

  const numero = valor('ord-numero');
  const r = numero
    ? await API.put('/api/ordenes/' + numero, datos)
    : await API.post('/api/ordenes', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioOrden();
  cargarOrdenes();
}

async function eliminarOrden(numero) {
  if (!confirm('Eliminar la orden ' + numero + '?')) return;

  const r = await API.borrar('/api/ordenes/' + numero);
  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarOrdenes();
}

// ---------- 6. CLIENTES -----------------------------------------------------
async function cargarClientes() {
  const busqueda = valor('buscar-cliente');
  const r = await API.get('/api/clientes' + (busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  window._clientes = r.datos;
  dibujarTabla('tabla-clientes', r.datos, f => botones('editarCliente', 'eliminarCliente', f.cedula));
}

function abrirFormularioCliente() {
  document.getElementById('titulo-formulario-cliente').textContent = 'Nuevo cliente';
  ['cli-cedula','cli-nombres','cli-telefono','cli-email','cli-direccion']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('cli-cedula').disabled = false;
  mostrarFormulario('formulario-cliente');
}

function cerrarFormularioCliente() {
  document.getElementById('formulario-cliente').classList.add('oculto');
}

function editarCliente(cedula) {
  const c = (window._clientes || []).find(x => x.cedula === cedula);
  if (!c) return;

  document.getElementById('titulo-formulario-cliente').textContent = 'Editar cliente ' + cedula;
  document.getElementById('cli-cedula').value    = c.cedula;
  document.getElementById('cli-cedula').disabled = true;      // la clave no se cambia
  document.getElementById('cli-nombres').value   = c.nombres;
  document.getElementById('cli-telefono').value  = c.telefono;
  document.getElementById('cli-email').value     = c.email;
  document.getElementById('cli-direccion').value = c.direccion;
  mostrarFormulario('formulario-cliente');
}

async function guardarCliente() {
  const editando = document.getElementById('cli-cedula').disabled;
  const datos = {
    cedula:    valor('cli-cedula'),
    nombres:   valor('cli-nombres'),
    telefono:  valor('cli-telefono'),
    email:     valor('cli-email'),
    direccion: valor('cli-direccion')
  };

  const r = editando
    ? await API.put('/api/clientes/' + datos.cedula, datos)
    : await API.post('/api/clientes', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioCliente();
  cargarClientes();
}

async function eliminarCliente(cedula) {
  if (!confirm('Eliminar el cliente ' + cedula + '?')) return;

  const r = await API.borrar('/api/clientes/' + cedula);
  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarClientes();
}

// ---------- 7. VEHICULOS ----------------------------------------------------
async function cargarVehiculos() {
  const busqueda = valor('buscar-vehiculo');
  const r = await API.get('/api/vehiculos' + (busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  window._vehiculos = r.datos;
  const filas = r.datos.map(v => ({
    placa: v.placa, marca: v.marca, modelo: v.modelo, anio: v.anio,
    cedula_cliente: v.cedulaCliente, cliente: v.cliente
  }));
  dibujarTabla('tabla-vehiculos', filas, f => botones('editarVehiculo', 'eliminarVehiculo', f.placa));
}

async function llenarClientesVehiculo() {
  const r = await API.get('/api/clientes');
  llenarSelect('veh-cliente', (r.datos || []).map(c => ({ valor: c.cedula, texto: c.nombres + ' - ' + c.cedula })), 'Seleccione...');
}

async function abrirFormularioVehiculo() {
  await llenarClientesVehiculo();
  document.getElementById('titulo-formulario-vehiculo').textContent = 'Nuevo vehiculo';
  ['veh-placa','veh-marca','veh-modelo','veh-anio','veh-cliente']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('veh-placa').disabled = false;
  mostrarFormulario('formulario-vehiculo');
}

function cerrarFormularioVehiculo() {
  document.getElementById('formulario-vehiculo').classList.add('oculto');
}

async function editarVehiculo(placa) {
  const v = (window._vehiculos || []).find(x => x.placa === placa);
  if (!v) return;

  await llenarClientesVehiculo();
  document.getElementById('titulo-formulario-vehiculo').textContent = 'Editar vehiculo ' + placa;
  document.getElementById('veh-placa').value    = v.placa;
  document.getElementById('veh-placa').disabled = true;
  document.getElementById('veh-marca').value    = v.marca;
  document.getElementById('veh-modelo').value   = v.modelo;
  document.getElementById('veh-anio').value     = v.anio;
  document.getElementById('veh-cliente').value  = v.cedulaCliente;
  mostrarFormulario('formulario-vehiculo');
}

async function guardarVehiculo() {
  const editando = document.getElementById('veh-placa').disabled;
  const datos = {
    placa:         valor('veh-placa').toUpperCase(),
    marca:         valor('veh-marca'),
    modelo:        valor('veh-modelo'),
    anio:          valor('veh-anio'),
    cedulaCliente: valor('veh-cliente')
  };

  const r = editando
    ? await API.put('/api/vehiculos/' + datos.placa, datos)
    : await API.post('/api/vehiculos', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioVehiculo();
  cargarVehiculos();
}

async function eliminarVehiculo(placa) {
  if (!confirm('Eliminar el vehiculo ' + placa + '?')) return;

  const r = await API.borrar('/api/vehiculos/' + placa);
  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarVehiculos();
}

// ---------- 8. SERVICIOS ----------------------------------------------------
async function cargarServicios() {
  const busqueda = valor('buscar-servicio');
  const r = await API.get('/api/servicios' + (busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  window._servicios = r.datos;
  const filas = r.datos.map(s => ({
    codigo: s.codigo, nombre: s.nombre, descripcion: s.descripcion,
    precio: s.precio, duracion_min: s.duracion
  }));
  dibujarTabla('tabla-servicios', filas, f => botones('editarServicio', 'eliminarServicio', f.codigo));
}

function abrirFormularioServicio() {
  document.getElementById('titulo-formulario-servicio').textContent = 'Nuevo servicio';
  ['srv-codigo','srv-nombre','srv-precio','srv-duracion','srv-descripcion']
    .forEach(id => document.getElementById(id).value = '');
  mostrarFormulario('formulario-servicio');
}

function cerrarFormularioServicio() {
  document.getElementById('formulario-servicio').classList.add('oculto');
}

function editarServicio(codigo) {
  const s = (window._servicios || []).find(x => x.codigo === codigo);
  if (!s) return;

  document.getElementById('titulo-formulario-servicio').textContent = 'Editar servicio ' + codigo;
  document.getElementById('srv-codigo').value      = s.codigo;
  document.getElementById('srv-nombre').value      = s.nombre;
  document.getElementById('srv-precio').value      = s.precio;
  document.getElementById('srv-duracion').value    = s.duracion;
  document.getElementById('srv-descripcion').value = s.descripcion || '';
  mostrarFormulario('formulario-servicio');
}

async function guardarServicio() {
  const datos = {
    nombre:      valor('srv-nombre'),
    precio:      valor('srv-precio'),
    duracion:    valor('srv-duracion'),
    descripcion: valor('srv-descripcion')
  };

  const codigo = valor('srv-codigo');
  const r = codigo
    ? await API.put('/api/servicios/' + codigo, datos)
    : await API.post('/api/servicios', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioServicio();
  cargarServicios();
}

async function eliminarServicio(codigo) {
  if (!confirm('Eliminar el servicio ' + codigo + '?')) return;

  const r = await API.borrar('/api/servicios/' + codigo);
  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarServicios();
}

// ---------- 9. MECANICOS ---------------------------------------------------
async function cargarMecanicos() {
  const busqueda = valor('buscar-mecanico');
  const r = await API.get('/api/mecanicos' + (busqueda ? '?busqueda=' + encodeURIComponent(busqueda) : ''));

  if (!r.ok) return avisar(r.mensaje, true);

  window._mecanicos = r.datos;
  const filas = r.datos.map(m => ({
    id: m.id, nombres: m.nombres, especialidad: m.especialidad,
    usuario: m.usuario, rol: m.rol, estado: m.activo ? 'ACTIVO' : 'INACTIVO'
  }));
  dibujarTabla('tabla-mecanicos', filas, f => botones('editarMecanico', 'eliminarMecanico', f.id));
}

function abrirFormularioMecanico() {
  document.getElementById('titulo-formulario-mecanico').textContent = 'Nuevo mecanico';
  document.getElementById('etiqueta-mec-password').textContent = 'Contrasena *';
  ['mec-id','mec-nombres','mec-especialidad','mec-usuario','mec-password']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('mec-rol').value    = 'MECANICO';
  document.getElementById('mec-activo').value = 'true';
  mostrarFormulario('formulario-mecanico');
}

function cerrarFormularioMecanico() {
  document.getElementById('formulario-mecanico').classList.add('oculto');
}

function editarMecanico(id) {
  const m = (window._mecanicos || []).find(x => x.id === Number(id));
  if (!m) return;

  document.getElementById('titulo-formulario-mecanico').textContent = 'Editar mecanico ' + m.nombres;
  document.getElementById('etiqueta-mec-password').textContent = 'Contrasena (vacio = no cambiar)';
  document.getElementById('mec-id').value           = m.id;
  document.getElementById('mec-nombres').value      = m.nombres;
  document.getElementById('mec-especialidad').value = m.especialidad;
  document.getElementById('mec-usuario').value      = m.usuario;
  document.getElementById('mec-password').value     = '';
  document.getElementById('mec-rol').value          = m.rol;
  document.getElementById('mec-activo').value       = String(m.activo);
  mostrarFormulario('formulario-mecanico');
}

async function guardarMecanico() {
  const datos = {
    nombres:      valor('mec-nombres'),
    especialidad: valor('mec-especialidad'),
    usuario:      valor('mec-usuario'),
    rol:          valor('mec-rol'),
    activo:       valor('mec-activo') === 'true'
  };
  const password = document.getElementById('mec-password').value;
  if (password) datos.password = password;

  const id = valor('mec-id');
  const r = id
    ? await API.put('/api/mecanicos/' + id, datos)
    : await API.post('/api/mecanicos', datos);

  if (!r.ok) return avisar(r.mensaje, true);

  avisar(r.mensaje);
  cerrarFormularioMecanico();
  cargarMecanicos();
}

async function eliminarMecanico(id) {
  if (!confirm('Eliminar el mecanico ' + id + '?')) return;

  const r = await API.borrar('/api/mecanicos/' + id);
  if (!r.ok) return avisar(r.mensaje, true);
  avisar(r.mensaje);
  cargarMecanicos();
}

// ---------- 10. CONSULTAS ---------------------------------------------------
async function consultarOrdenesCliente() {
  const cedula = valor('consulta-cliente');
  const r = await API.get('/api/consultas/ordenes-cliente' + (cedula ? '?cedula=' + encodeURIComponent(cedula) : ''));

  if (!r.ok) return avisar(r.mensaje, true);
  dibujarTabla('tabla-consulta-cliente', r.datos);
}

async function consultarOrdenesFechas() {
  const desde = valor('consulta-desde');
  const hasta = valor('consulta-hasta');

  if (!desde || !hasta) return avisar('Indique ambas fechas', true);

  const r = await API.get('/api/consultas/ordenes-fechas?desde=' + desde + '&hasta=' + hasta);

  if (!r.ok) return avisar(r.mensaje, true);
  dibujarTabla('tabla-consulta-fechas', r.datos);
}
