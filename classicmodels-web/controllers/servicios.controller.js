// =============================================================================
// controllers/servicios.controller.js  -  CRUD DE SERVICIOS
// =============================================================================

const { servicios, ordenesTrabajo, guardarDoc, eliminarDoc } = require('../datos');
const { coincide } = require('./comun');

function validar(b) {
  if (!b.nombre) return 'Indique el nombre';
  const precio = Number(b.precio), duracion = Number(b.duracion);
  if (precio <= 0)                                  return 'El precio debe ser mayor a 0';
  if (!Number.isInteger(duracion) || duracion <= 0) return 'La duracion debe ser un numero entero de minutos';
  return null;
}

// GET /api/servicios?busqueda=texto
function listar(req, res) {
  const q = req.query.busqueda;
  const datos = servicios.filter(s => coincide(q, s.nombre, s.codigo));
  res.json({ ok: true, datos });
}

// POST /api/servicios   (el codigo se genera solo: SRV-009, SRV-010, ...)
function crear(req, res) {
  const b = req.body;
  const error = validar(b);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  const siguiente = Math.max(0, ...servicios.map(s => Number(s.codigo.slice(4)))) + 1;
  const codigo = 'SRV-' + String(siguiente).padStart(3, '0');

  const nuevo = {
    codigo, nombre: b.nombre, descripcion: b.descripcion || '',
    precio: Number(b.precio), duracion: Number(b.duracion)
  };
  servicios.push(nuevo);
  guardarDoc('servicios', codigo, nuevo);
  res.json({ ok: true, codigo, mensaje: 'Servicio creado' });
}

// PUT /api/servicios/:codigo
// Cambiar el precio NO altera las ordenes ya registradas (guardan su precio).
function actualizar(req, res) {
  const s = servicios.find(x => x.codigo === req.params.codigo);
  if (!s) return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });

  const nuevo = { ...s, ...req.body };
  const error = validar(nuevo);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  s.nombre      = nuevo.nombre;
  s.descripcion = nuevo.descripcion || '';
  s.precio      = Number(nuevo.precio);
  s.duracion    = Number(nuevo.duracion);
  guardarDoc('servicios', s.codigo, s);
  res.json({ ok: true, mensaje: 'Servicio actualizado' });
}

// DELETE /api/servicios/:codigo
// No se puede eliminar un servicio que aparece en alguna orden.
function eliminar(req, res) {
  const i = servicios.findIndex(x => x.codigo === req.params.codigo);
  if (i === -1) return res.status(404).json({ ok: false, mensaje: 'Servicio no encontrado' });

  if (ordenesTrabajo.some(o => o.detalle.some(d => d.codigoServicio === req.params.codigo))) {
    return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar: el servicio se usa en ordenes de trabajo' });
  }

  servicios.splice(i, 1);
  eliminarDoc('servicios', req.params.codigo);
  res.json({ ok: true, mensaje: 'Servicio eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
