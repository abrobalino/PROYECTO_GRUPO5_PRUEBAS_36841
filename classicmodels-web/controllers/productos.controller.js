// =============================================================================
// controllers/productos.controller.js  -  CRUD DE PRODUCTOS
// =============================================================================

const { ejecutar, OUT } = require('../db');

// GET /api/productos?busqueda=&linea=
async function listar(req, res) {
  try {
    const r = await ejecutar(
      `BEGIN sp_producto_listar(:busqueda, :linea, :cursor, :mensaje); END;`,
      {
        busqueda: req.query.busqueda || null,
        linea:    req.query.linea    || null,
        cursor:   OUT.cursor,
        mensaje:  OUT.texto
      }
    );
    res.json({ ok: r.mensaje === 'OK', datos: r.cursor, mensaje: r.mensaje });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// POST /api/productos
async function crear(req, res) {
  const b = req.body;
  try {
    const r = await ejecutar(
      `BEGIN sp_producto_insertar(:codigo, :nombre, :linea, :escala, :proveedor,
                                  :descripcion, :stock, :precioCompra,
                                  :precioVenta, :mensaje); END;`,
      {
        codigo:       b.codigo,
        nombre:       b.nombre,
        linea:        b.linea,
        escala:       b.escala,
        proveedor:    b.proveedor,
        descripcion:  b.descripcion || null,
        stock:        Number(b.stock),
        precioCompra: Number(b.precioCompra),
        precioVenta:  Number(b.precioVenta),
        mensaje:      OUT.texto
      }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, mensaje: 'Producto creado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// PUT /api/productos/:codigo
async function actualizar(req, res) {
  const b = req.body;
  const num = (v) => (v === undefined || v === '' || v === null) ? null : Number(v);
  try {
    const r = await ejecutar(
      `BEGIN sp_producto_actualizar(:codigo, :nombre, :linea, :proveedor,
                                    :stock, :precioCompra, :precioVenta,
                                    :mensaje); END;`,
      {
        codigo:       req.params.codigo,
        nombre:       b.nombre    || null,
        linea:        b.linea     || null,
        proveedor:    b.proveedor || null,
        stock:        num(b.stock),
        precioCompra: num(b.precioCompra),
        precioVenta:  num(b.precioVenta),
        mensaje:      OUT.texto
      }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, mensaje: 'Producto actualizado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// DELETE /api/productos/:codigo
async function eliminar(req, res) {
  try {
    const r = await ejecutar(
      `BEGIN sp_producto_eliminar(:codigo, :mensaje); END;`,
      { codigo: req.params.codigo, mensaje: OUT.texto }
    );
    if (r.mensaje !== 'OK') return res.status(400).json({ ok: false, mensaje: r.mensaje });
    res.json({ ok: true, mensaje: 'Producto eliminado' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

module.exports = { listar, crear, actualizar, eliminar };
