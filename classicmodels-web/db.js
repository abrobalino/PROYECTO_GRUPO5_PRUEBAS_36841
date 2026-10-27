// =============================================================================
// db.js  -  CONEXION CON ORACLE
// =============================================================================
// Contiene tres cosas:
//   1. iniciarPool()  -> abre el conjunto de conexiones al arrancar el servidor
//   2. ejecutar()     -> ejecuta un bloque PL/SQL y devuelve los parametros OUT
//   3. cerrarPool()   -> cierra las conexiones al apagar el servidor
//
// QUE ES UN POOL: en lugar de abrir y cerrar una conexion en cada peticion
// (lento), se abre un grupo de conexiones al inicio y se van prestando.
// =============================================================================

const oracledb = require('oracledb');
require('dotenv').config();

// Los resultados llegan como objetos { columna: valor } en vez de arreglos
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function iniciarPool() {
  await oracledb.createPool({
    user:          process.env.DB_USER,
    password:      process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT,
    poolMin: 2,
    poolMax: 10
  });
  console.log('Pool de conexiones Oracle creado');
}

async function cerrarPool() {
  await oracledb.getPool().close(10);
  console.log('Pool de conexiones cerrado');
}

// ---------------------------------------------------------------------------
// ejecutar(sql, binds)
//   sql   : bloque PL/SQL, por ejemplo  'BEGIN sp_login(:u, :p, ...); END;'
//   binds : objeto con los parametros de entrada y salida
//
// Si algun parametro de salida es un cursor, esta funcion lo convierte
// automaticamente en un arreglo de filas listo para enviar como JSON.
// ---------------------------------------------------------------------------
async function ejecutar(sql, binds = {}) {
  let conexion;
  try {
    conexion = await oracledb.getConnection();
    const resultado = await conexion.execute(sql, binds);
    const salida = { ...resultado.outBinds };

    // Convertir los cursores en arreglos de filas
    for (const clave of Object.keys(salida)) {
      const valor = salida[clave];
      if (valor && typeof valor.getRows === 'function') {
        salida[clave] = await valor.getRows();
        await valor.close();
      }
    }
    return salida;

  } finally {
    if (conexion) {
      try { await conexion.close(); } catch (e) { console.error(e); }
    }
  }
}

// Atajos para declarar parametros de salida
const OUT = {
  numero:  { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
  texto:   { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500 },
  cursor:  { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
};

module.exports = { iniciarPool, cerrarPool, ejecutar, OUT, oracledb };
