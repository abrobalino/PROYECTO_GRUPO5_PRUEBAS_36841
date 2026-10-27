// =============================================================================
// controllers/reportes.controller.js  -  CONSULTAS Y REPORTES
// =============================================================================
// Las CONSULTAS usan procedimientos almacenados (parametros del usuario).
// Los REPORTES leen directamente las VISTAS creadas en la Fase 8.
// =============================================================================

const { ejecutar, oracledb, OUT } = require('../db');

// ---------------------------------------------------------------------------
// CONSULTA 1: ventas por cliente  ->  GET /api/reportes/ventas-cliente?codigo=141
// ---------------------------------------------------------------------------
async function ventasPorCliente(req, res) {
  try {
    const r = await ejecutar(
      `BEGIN sp_ventas_por_cliente(:codigo, :cursor, :mensaje); END;`,
      {
        codigo:  req.query.codigo ? Number(req.query.codigo) : null,
        cursor:  OUT.cursor,
        mensaje: OUT.texto
      }
    );
    res.json({ ok: r.mensaje === 'OK', datos: r.cursor, mensaje: r.mensaje });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// ---------------------------------------------------------------------------
// CONSULTA 2: ventas por fechas
//   GET /api/reportes/ventas-fechas?desde=2004-01-01&hasta=2004-01-31
// ---------------------------------------------------------------------------
async function ventasPorFechas(req, res) {
  const { desde, hasta } = req.query;

  if (!desde || !hasta) {
    return res.status(400).json({ ok: false, mensaje: 'Indique las fechas desde y hasta' });
  }

  try {
    // Las fechas se envian como TEXTO y se convierten con TO_DATE dentro del
    // SQL. Si se enviaran como objetos Date de JavaScript, la zona horaria del
    // sistema podria desplazar el dia y falsear el reporte.
    const r = await ejecutar(
      `BEGIN sp_ventas_por_fechas(TO_DATE(:desde, 'YYYY-MM-DD'),
                                  TO_DATE(:hasta, 'YYYY-MM-DD'),
                                  :cursor, :mensaje); END;`,
      {
        desde:   desde,
        hasta:   hasta,
        cursor:  OUT.cursor,
        mensaje: OUT.texto
      }
    );
    res.json({ ok: r.mensaje === 'OK', datos: r.cursor, mensaje: r.mensaje });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// ---------------------------------------------------------------------------
// REPORTES basados en vistas  ->  GET /api/reportes/vista/:nombre
//
// SEGURIDAD: el nombre de la vista NO se concatena directamente en el SQL.
// Se usa una lista blanca; si el nombre no esta en ella, se rechaza.
// Asi se evita la inyeccion de SQL.
// ---------------------------------------------------------------------------
const VISTAS = {
  'por-cliente':   'SELECT * FROM v_ventas_por_cliente WHERE total_pedidos > 0 ORDER BY total_facturado DESC',
  'por-periodo':   'SELECT * FROM v_ventas_por_periodo ORDER BY anio, mes',
  'top-productos': 'SELECT * FROM v_top_productos ORDER BY ingresos DESC FETCH FIRST 20 ROWS ONLY',
  'stock-critico': 'SELECT * FROM v_stock_critico ORDER BY stock',
  'por-oficina':   'SELECT * FROM v_ventas_por_oficina ORDER BY total_ventas DESC',
  'estado-cuenta': 'SELECT * FROM v_estado_cuenta ORDER BY saldo_pendiente DESC',
  'auditoria':     'SELECT * FROM auditoria ORDER BY auditoriaId DESC FETCH FIRST 50 ROWS ONLY'
};

async function vista(req, res) {
  const sql = VISTAS[req.params.nombre];

  if (!sql) {
    return res.status(404).json({ ok: false, mensaje: 'Reporte no encontrado' });
  }

  let conexion;
  try {
    conexion = await oracledb.getConnection();
    const r = await conexion.execute(sql);
    res.json({ ok: true, datos: r.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  } finally {
    if (conexion) await conexion.close();
  }
}

module.exports = { ventasPorCliente, ventasPorFechas, vista };
