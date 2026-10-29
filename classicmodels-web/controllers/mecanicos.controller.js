// =============================================================================
// controllers/mecanicos.controller.js  -  CRUD DE MECANICOS
// =============================================================================
// La contrasena nunca se envia al navegador.
// =============================================================================

const { mecanicos, ordenesTrabajo } = require('../datos');
const { coincide } = require('./comun');

const ROLES = new Set(['ADMIN', 'MECANICO']);

// Copia del mecanico sin la contrasena
const publico = ({ password, ...resto }) => resto;

// GET /api/mecanicos?busqueda=&activos=1
function listar(req, res) {
  const q = req.query.busqueda;
  const soloActivos = req.query.activos === '1';

  const datos = mecanicos
    .filter(m => !soloActivos || m.activo)
    .filter(m => coincide(q, m.nombres, m.especialidad))
    .map(publico);

  res.json({ ok: true, datos });
}

// POST /api/mecanicos
function crear(req, res) {
  const b = req.body;

  if (!b.nombres || !b.especialidad)         return res.status(400).json({ ok: false, mensaje: 'Indique nombres y especialidad' });
  if (!b.usuario || b.usuario.length < 4)    return res.status(400).json({ ok: false, mensaje: 'El usuario debe tener minimo 4 caracteres' });
  if (!b.password || b.password.length < 6)  return res.status(400).json({ ok: false, mensaje: 'La contrasena debe tener minimo 6 caracteres' });
  if (!ROLES.has(b.rol))                     return res.status(400).json({ ok: false, mensaje: 'Rol no valido' });
  if (mecanicos.some(m => m.usuario === b.usuario)) {
    return res.status(400).json({ ok: false, mensaje: 'El usuario ya existe' });
  }

  const id = Math.max(0, ...mecanicos.map(m => m.id)) + 1;
  mecanicos.push({
    id, nombres: b.nombres, especialidad: b.especialidad, activo: b.activo !== false,
    usuario: b.usuario, password: b.password, rol: b.rol
  });
  res.json({ ok: true, id, mensaje: 'Mecanico creado' });
}

// PUT /api/mecanicos/:id   (si password viene vacio, se conserva la actual)
function actualizar(req, res) {
  const m = mecanicos.find(x => x.id === Number(req.params.id));
  if (!m) return res.status(404).json({ ok: false, mensaje: 'Mecanico no encontrado' });

  const b = req.body;
  if (b.usuario !== undefined && b.usuario.length < 4) return res.status(400).json({ ok: false, mensaje: 'El usuario debe tener minimo 4 caracteres' });
  if (b.usuario && mecanicos.some(x => x.usuario === b.usuario && x.id !== m.id)) {
    return res.status(400).json({ ok: false, mensaje: 'El usuario ya existe' });
  }
  if (b.password && b.password.length < 6) return res.status(400).json({ ok: false, mensaje: 'La contrasena debe tener minimo 6 caracteres' });
  if (b.rol && !ROLES.has(b.rol))          return res.status(400).json({ ok: false, mensaje: 'Rol no valido' });

  if (b.nombres)              m.nombres      = b.nombres;
  if (b.especialidad)         m.especialidad = b.especialidad;
  if (b.usuario)              m.usuario      = b.usuario;
  if (b.password)             m.password     = b.password;
  if (b.rol)                  m.rol          = b.rol;
  if (b.activo !== undefined) m.activo       = Boolean(b.activo);

  res.json({ ok: true, mensaje: 'Mecanico actualizado' });
}

// DELETE /api/mecanicos/:id
// Si el mecanico ya tiene ordenes, no se borra: se marca como inactivo
// para no perder el historial.
function eliminar(req, res) {
  const id = Number(req.params.id);
  const i = mecanicos.findIndex(x => x.id === id);
  if (i === -1) return res.status(404).json({ ok: false, mensaje: 'Mecanico no encontrado' });

  if (ordenesTrabajo.some(o => o.mecanicoId === id)) {
    mecanicos[i].activo = false;
    return res.json({ ok: true, mensaje: 'El mecanico tiene ordenes: se marco como inactivo' });
  }

  mecanicos.splice(i, 1);
  res.json({ ok: true, mensaje: 'Mecanico eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
