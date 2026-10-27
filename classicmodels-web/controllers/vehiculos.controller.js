// =============================================================================
// controllers/vehiculos.controller.js  -  CRUD DE VEHICULOS
// =============================================================================

const { vehiculos, clientes, ordenesTrabajo } = require('../datos');
const { coincide } = require('./comun');

// Placa ecuatoriana: 3 letras, guion y 3 o 4 numeros (ej. PBA-1234)
const PLACA = /^[A-Z]{3}-\d{3,4}$/;

function validar(b) {
  if (!PLACA.test(b.placa || ''))  return 'La placa debe tener el formato ABC-1234';
  if (!b.marca)                    return 'Indique la marca';
  if (!b.modelo)                   return 'Indique el modelo';
  const anio = Number(b.anio);
  if (!Number.isInteger(anio) || anio < 1950 || anio > new Date().getFullYear() + 1) {
    return 'El anio no es valido';
  }
  if (!clientes.some(c => c.cedula === b.cedulaCliente)) return 'El cliente dueno no existe';
  return null;
}

// GET /api/vehiculos?busqueda=&cliente=cedula
function listar(req, res) {
  const q       = req.query.busqueda;
  const cliente = req.query.cliente || null;

  const datos = vehiculos
    .filter(v => !cliente || v.cedulaCliente === cliente)
    .filter(v => coincide(q, v.placa, v.marca, v.modelo))
    .map(v => {
      const c = clientes.find(x => x.cedula === v.cedulaCliente);
      return { ...v, cliente: c ? c.nombres : '' };
    });

  res.json({ ok: true, datos });
}

// POST /api/vehiculos
function crear(req, res) {
  const b = { ...req.body, placa: (req.body.placa || '').toUpperCase().trim() };
  const error = validar(b);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  if (vehiculos.some(v => v.placa === b.placa)) {
    return res.status(400).json({ ok: false, mensaje: 'Ya existe un vehiculo con esa placa' });
  }

  vehiculos.push({
    placa: b.placa, marca: b.marca, modelo: b.modelo,
    anio: Number(b.anio), cedulaCliente: b.cedulaCliente
  });
  res.json({ ok: true, placa: b.placa, mensaje: 'Vehiculo creado' });
}

// PUT /api/vehiculos/:placa   (la placa no se cambia)
function actualizar(req, res) {
  const v = vehiculos.find(x => x.placa === req.params.placa);
  if (!v) return res.status(404).json({ ok: false, mensaje: 'Vehiculo no encontrado' });

  const nuevo = { ...v, ...req.body, placa: v.placa };
  const error = validar(nuevo);
  if (error) return res.status(400).json({ ok: false, mensaje: error });

  v.marca         = nuevo.marca;
  v.modelo        = nuevo.modelo;
  v.anio          = Number(nuevo.anio);
  v.cedulaCliente = nuevo.cedulaCliente;
  res.json({ ok: true, mensaje: 'Vehiculo actualizado' });
}

// DELETE /api/vehiculos/:placa
// No se puede eliminar un vehiculo que tiene ordenes de trabajo.
function eliminar(req, res) {
  const i = vehiculos.findIndex(x => x.placa === req.params.placa);
  if (i === -1) return res.status(404).json({ ok: false, mensaje: 'Vehiculo no encontrado' });

  if (ordenesTrabajo.some(o => o.placa === req.params.placa)) {
    return res.status(400).json({ ok: false, mensaje: 'No se puede eliminar: el vehiculo tiene ordenes de trabajo' });
  }

  vehiculos.splice(i, 1);
  res.json({ ok: true, mensaje: 'Vehiculo eliminado' });
}

module.exports = { listar, crear, actualizar, eliminar };
