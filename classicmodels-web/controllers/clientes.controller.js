// =============================================================================
// controllers/clientes.controller.js  -  CRUD DE CLIENTES
// =============================================================================

const { ejecutar, OUT } = require('../db');

// GET /api/clientes?busqueda=texto
async function listar(req, res) {
  try {
    const r = await ejecutar(
      `BEGIN sp_cliente_listar(:busqueda, :cursor, :mensaje); END;`,
      { busqueda: req.query.busqueda || null, cursor: OUT.cursor, mensaje: OUT.texto }
    );
    res.json({ ok: r.mensaje === 'OK', datos: r.cursor, mensaje: r.mensaje });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// POST /api/clientes
async function crear(req, res) {
  const b = req.body;
  try {
    const r = await ejecutar(
      `BEGIN sp_cliente_insertar(:nombre, :contactoNom, :contactoApe, :telefono,
                                 :direccion, :ciudad, :pais, :vendedor, :limite,
                                 :codigo, :mensaje); END;`,
      {
        nombre:      b.nombre,
        contactoNom: b.contactoNom,
        contactoApe: b.contactoApe,
        telefono:    b.telefono,
        direccion:   b.direccion,
        ciudad:      b.ciudad,
        pais:        b.pais,
        vendedor:    b.vendedor || null,
        limite:      b.limite || 0,
        codigo:      OUT.numero,
        mensaje:     OUT.texto
      }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, codigo: r.codigo, mensaje: 'Cliente creado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// PUT /api/clientes/:codigo
async function actualizar(req, res) {
  const b = req.body;
  try {
    const r = await ejecutar(
      `BEGIN sp_cliente_actualizar(:codigo, :nombre, :contactoNom, :contactoApe,
                                   :telefono, :direccion, :ciudad, :pais,
                                   :vendedor, :limite, :mensaje); END;`,
      {
        codigo:      Number(req.params.codigo),
        nombre:      b.nombre      || null,
        contactoNom: b.contactoNom || null,
        contactoApe: b.contactoApe || null,
        telefono:    b.telefono    || null,
        direccion:   b.direccion   || null,
        ciudad:      b.ciudad      || null,
        pais:        b.pais        || null,
        vendedor:    b.vendedor    || null,
        limite:      (b.limite === undefined || b.limite === '') ? null : Number(b.limite),
        mensaje:     OUT.texto
      }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, mensaje: 'Cliente actualizado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// DELETE /api/clientes/:codigo
async function eliminar(req, res) {
  try {
    const r = await ejecutar(
      `BEGIN sp_cliente_eliminar(:codigo, :mensaje); END;`,
      { codigo: Number(req.params.codigo), mensaje: OUT.texto }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, mensaje: 'Cliente eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

module.exports = { listar, crear, actualizar, eliminar };
