// =============================================================================
// controllers/consultas.controller.js  -  CONSULTAS DE ORDENES
// =============================================================================
// Busquedas de ordenes con parametros del usuario (cliente, fechas).
// =============================================================================

const { clientes, ordenesTrabajo } = require('../datos');
const { enriquecer } = require('./ordenes.controller');

// Fila resumida de una orden para las consultas
const filaOrden = o => ({
  numero: o.numero, fecha: o.fecha, placa: o.placa, vehiculo: o.vehiculo,
  cliente: o.cliente, mecanico: o.mecanico,
  servicios: o.detalle.map(d => d.nombre + (d.cantidad > 1 ? ' x' + d.cantidad : '')).join(', '),
  estado: o.estado, total: o.total
});

// ---------------------------------------------------------------------------
// CONSULTA 1: ordenes de un cliente  ->  GET /api/consultas/ordenes-cliente?cedula=
// ---------------------------------------------------------------------------
function ordenesPorCliente(req, res) {
  const cedula = req.query.cedula || null;

  if (cedula && !clientes.some(c => c.cedula === cedula)) {
    return res.json({ ok: false, mensaje: 'No existe un cliente con la cedula ' + cedula });
  }

  const datos = ordenesTrabajo.map(enriquecer)
    .filter(o => !cedula || o.cedulaCliente === cedula)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(filaOrden);

  res.json({ ok: true, datos });
}

// ---------------------------------------------------------------------------
// CONSULTA 2: ordenes entre fechas
//   GET /api/consultas/ordenes-fechas?desde=2026-09-01&hasta=2026-09-30
// Las fechas se comparan como texto YYYY-MM-DD, asi no hay problemas de
// zona horaria.
// ---------------------------------------------------------------------------
function ordenesPorFechas(req, res) {
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ ok: false, mensaje: 'Indique las fechas desde y hasta' });
  }
  if (desde > hasta) {
    return res.status(400).json({ ok: false, mensaje: 'La fecha desde no puede ser mayor que hasta' });
  }

  const datos = ordenesTrabajo
    .filter(o => o.fecha >= desde && o.fecha <= hasta)
    .map(enriquecer)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(filaOrden);

  res.json({ ok: true, datos });
}

module.exports = { ordenesPorCliente, ordenesPorFechas };
