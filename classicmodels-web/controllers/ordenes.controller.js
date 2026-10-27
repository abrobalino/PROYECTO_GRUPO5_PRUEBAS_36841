// =============================================================================
// controllers/ordenes.controller.js  -  CRUD DE ORDENES DE TRABAJO
// =============================================================================
// Una orden reune lo que antes eran orders + orderdetails: el detalle de
// servicios va DENTRO de la orden como un arreglo.
//
// Reglas:
//   - El vehiculo debe existir y el mecanico debe estar activo.
//   - El detalle necesita al menos un servicio del catalogo.
//   - El estado solo avanza: PENDIENTE -> EN PROCESO -> TERMINADA -> ENTREGADA
//   - Una orden ENTREGADA ya no se modifica.
//   - Solo se eliminan ordenes PENDIENTES.
// =============================================================================

const { ordenesTrabajo, vehiculos, clientes, mecanicos, servicios } = require('../datos');
const { coincide } = require('./comun');

const ESTADOS = ['PENDIENTE', 'EN PROCESO', 'TERMINADA', 'ENTREGADA'];

const redondear = n => Math.round(n * 100) / 100;

// Agrega a la orden los datos de vehiculo, cliente, mecanico y el total.
// Lo usan tambien las consultas.
function enriquecer(o) {
  const v = vehiculos.find(x => x.placa === o.placa);
  const c = v && clientes.find(x => x.cedula === v.cedulaCliente);
  const m = mecanicos.find(x => x.id === o.mecanicoId);
  return {
    ...o,
    vehiculo:      v ? v.marca + ' ' + v.modelo : '',
    cedulaCliente: c ? c.cedula  : '',
    cliente:       c ? c.nombres : '',
    mecanico:      m ? m.nombres : '',
    total:         redondear(o.detalle.reduce((s, d) => s + d.precio * d.cantidad, 0))
  };
}

// Convierte el detalle que envia el navegador [{ codigoServicio, cantidad }]
// en el detalle que se guarda. Si el servicio ya estaba en la orden, se
// conserva su precio original. Devuelve { detalle } o { error }.
function armarDetalle(lineas, anterior = []) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    return { error: 'La orden debe tener al menos un servicio' };
  }

  const detalle = [];
  for (const l of lineas) {
    const s = servicios.find(x => x.codigo === l.codigoServicio);
    if (!s) return { error: 'El servicio ' + l.codigoServicio + ' no existe' };

    const cantidad = Number(l.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { error: 'La cantidad de ' + s.nombre + ' debe ser un entero mayor a 0' };
    }

    // Un mismo servicio repetido se suma en una sola linea
    const repetida = detalle.find(d => d.codigoServicio === s.codigo);
    if (repetida) { repetida.cantidad += cantidad; continue; }

    const previa = anterior.find(d => d.codigoServicio === s.codigo);
    detalle.push({
      codigoServicio: s.codigo,
      nombre:   previa ? previa.nombre : s.nombre,
      precio:   previa ? previa.precio : s.precio,
      cantidad
    });
  }
  return { detalle };
}

// mecanicoAnterior: al editar, se acepta conservar al mismo mecanico
// aunque despues haya quedado inactivo.
function validarCabecera(b, mecanicoAnterior = null) {
  if (!vehiculos.some(v => v.placa === b.placa)) return 'El vehiculo no existe';
  const m = mecanicos.find(x => x.id === Number(b.mecanicoId));
  if (!m) return 'El mecanico no existe';
  if (!m.activo && m.id !== mecanicoAnterior) return 'El mecanico ' + m.nombres + ' esta inactivo';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.fecha || '') || isNaN(new Date(b.fecha))) return 'La fecha no es valida';
  if (!ESTADOS.includes(b.estado)) return 'Estado no valido';
  return null;
}

// GET /api/ordenes?estado=&placa=&busqueda=
function listar(req, res) {
  const { estado, placa } = req.query;
  const q = req.query.busqueda;

  const datos = ordenesTrabajo
    .filter(o => !estado || o.estado === estado)
    .filter(o => !placa  || o.placa === placa)
    .map(enriquecer)
    .filter(o => coincide(q, o.numero, o.placa, o.cliente, o.mecanico))
    .sort((a, b) => b.numero - a.numero);

  res.json({ ok: true, datos });
}

// GET /api/ordenes/:numero
function obtener(req, res) {
  const o = ordenesTrabajo.find(x => x.numero === Number(req.params.numero));
  if (!o) return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada' });
  res.json({ ok: true, datos: enriquecer(o) });
}

// POST /api/ordenes
function crear(req, res) {
  const b = {
    ...req.body,
    fecha:  req.body.fecha  || new Date().toISOString().slice(0, 10),
    estado: req.body.estado || 'PENDIENTE'
  };

  const error = validarCabecera(b);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const r = armarDetalle(b.detalle);
  if (r.error) return res.status(400).json({ ok: false, mensaje: r.error });

  const numero = Math.max(1000, ...ordenesTrabajo.map(o => o.numero)) + 1;
  ordenesTrabajo.push({
    numero, fecha: b.fecha, placa: b.placa, mecanicoId: Number(b.mecanicoId),
    estado: b.estado, observaciones: b.observaciones || '', detalle: r.detalle
  });
  res.json({ ok: true, numero, mensaje: 'Orden ' + numero + ' creada' });
}

// PUT /api/ordenes/:numero
function actualizar(req, res) {
  const o = ordenesTrabajo.find(x => x.numero === Number(req.params.numero));
  if (!o) return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada' });

  if (o.estado === 'ENTREGADA') {
    return res.status(400).json({ ok: false, mensaje: 'La orden ya fue entregada y no se puede modificar' });
  }

  const nuevo = { ...o, ...req.body };

  const error = validarCabecera(nuevo, o.mecanicoId);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  if (ESTADOS.indexOf(nuevo.estado) < ESTADOS.indexOf(o.estado)) {
    return res.status(400).json({ ok: false, mensaje: 'El estado no puede retroceder de ' + o.estado + ' a ' + nuevo.estado });
  }

  let detalle = o.detalle;
  if (req.body.detalle !== undefined) {
    const r = armarDetalle(req.body.detalle, o.detalle);
    if (r.error) return res.status(400).json({ ok: false, mensaje: r.error });
    detalle = r.detalle;
  }

  o.fecha         = nuevo.fecha;
  o.placa         = nuevo.placa;
  o.mecanicoId    = Number(nuevo.mecanicoId);
  o.estado        = nuevo.estado;
  o.observaciones = nuevo.observaciones || '';
  o.detalle       = detalle;
  res.json({ ok: true, mensaje: 'Orden actualizada' });
}

// DELETE /api/ordenes/:numero
function eliminar(req, res) {
  const i = ordenesTrabajo.findIndex(x => x.numero === Number(req.params.numero));
  if (i === -1) return res.status(404).json({ ok: false, mensaje: 'Orden no encontrada' });

  if (ordenesTrabajo[i].estado !== 'PENDIENTE') {
    return res.status(400).json({ ok: false, mensaje: 'Solo se pueden eliminar ordenes PENDIENTES' });
  }

  ordenesTrabajo.splice(i, 1);
  res.json({ ok: true, mensaje: 'Orden eliminada' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, enriquecer };
