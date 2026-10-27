// =============================================================================
// controllers/clientes.controller.js  -  CRUD DE CLIENTES
// =============================================================================

const { clientes, vehiculos } = require('../datos');
const { coincide } = require('./comun');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Revisa los campos obligatorios. Devuelve el mensaje de error o null.
function validar(b) {
  if (!/^\d{10}$/.test(b.cedula || ''))  return 'La cedula debe tener 10 digitos';
  if (!b.nombres)                         return 'Indique los nombres';
  if (!/^\d{7,10}$/.test(b.telefono || '')) return 'El telefono debe tener entre 7 y 10 digitos';
  if (!EMAIL.test(b.email || ''))         return 'El email no es valido';
  if (!b.direccion)                       return 'Indique la direccion';
  return null;
}

// GET /api/clientes?busqueda=texto   (busca por nombre o cedula)
function listar(req, res) {
  const q = req.query.busqueda;

  const datos = clientes
    .filter(c => coincide(q, c.nombres, c.cedula))
    .map(c => ({ ...c, vehiculos: vehiculos.filter(v => v.cedulaCliente === c.cedula).length }));

  res.json({ ok: true, datos });
}

// POST /api/clientes
function crear(req, res) {
  const b = req.body;
  const error = validar(b);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  if (clientes.some(c => c.cedula === b.cedula)) {
    return res.status(400).json({ ok: false, mensaje: 'Ya existe un cliente con esa cedula' });
  }

  clientes.push({
    cedula: b.cedula, nombres: b.nombres, telefono: b.telefono,
    email: b.email, direccion: b.direccion
  });
  res.json({ ok: true, cedula: b.cedula, mensaje: 'Cliente creado' });
}

// PUT /api/clientes/:cedula   (la cedula no se cambia)
function actualizar(req, res) {
  const c = clientes.find(x => x.cedula === req.params.cedula);
  if (!c) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });

  const nuevo = { ...c, ...req.body, cedula: c.cedula };
  const error = validar(nuevo);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  c.nombres   = nuevo.nombres;
  c.telefono  = nuevo.telefono;
  c.email     = nuevo.email;
  c.direccion = nuevo.direccion;
  res.json({ ok: true, mensaje: 'Cliente actualizado' });
}

// DELETE /api/clientes/:cedula
// No se puede eliminar un cliente que todavia tiene vehiculos registrados.
function eliminar(req, res) {
  const i = clientes.findIndex(x => x.cedula === req.params.cedula);
  if (i === -1) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });

  if (vehiculos.some(v => v.cedulaCliente === req.params.cedula)) {
    return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar: el cliente tiene vehiculos registrados' });
  }

  clientes.splice(i, 1);
  res.json({ ok: true, mensaje: 'Cliente eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
