// =============================================================================
// server.js  -  ARRANQUE DEL SERVIDOR
// =============================================================================
// Base de Datos: Google Cloud Firestore (Firebase).
// Si la conexion con la base de datos se corta (USE_FIREBASE=false o falla de red),
// el servidor responde HTTP 503 (DATABASE_DISCONNECTED) en las peticiones.
// /api/ping sirve como healthcheck del servicio y estado de la base de datos.
// =============================================================================

require('dotenv').config();

const express = require('express');
const path    = require('node:path');

const app    = express();
app.disable('x-powered-by');
const PUERTO = process.env.PORT || 4000;

// --- Configuracion de Express ------------------------------------------------

// Permite leer el JSON que envia el cliente en req.body
app.use(express.json());

// Sirve el frontend (carpeta public) desde el MISMO servidor
app.use(express.static(path.join(__dirname, 'public')));

// Asegura que la conexion a la base de datos este activa y los datos cargados
const datos = require('./datos');
app.use(async (req, res, next) => {
  // El ping / healthcheck siempre responde para monitoreo
  if (req.path === '/api/ping') {
    return next();
  }

  // Comportamiento de produccion si la base de datos no esta conectada
  if (!datos.estaConectado) {
    return res.status(503).json({
      ok: false,
      error: 'DATABASE_DISCONNECTED',
      mensaje: 'Servicio no disponible: no hay conexion con la base de datos (Cloud Firestore)'
    });
  }

  if (!datos.cargados) {
    try {
      await datos.cargarDesdeFirestore();
    } catch (err) {
      return res.status(503).json({
        ok: false,
        error: 'DATABASE_UNAVAILABLE',
        mensaje: 'Error de comunicacion con la base de datos: ' + err.message
      });
    }
  }
  next();
});

// --- Rutas de la API ---------------------------------------------------------
app.use('/api/clientes',  require('./routes/clientes.routes'));
app.use('/api/vehiculos', require('./routes/vehiculos.routes'));
app.use('/api/servicios', require('./routes/servicios.routes'));
app.use('/api/mecanicos', require('./routes/mecanicos.routes'));
app.use('/api/ordenes',   require('./routes/ordenes.routes'));
app.use('/api/consultas', require('./routes/consultas.routes'));

// Ruta de healthcheck / monitoreo
app.get('/api/ping', (req, res) => res.json({
  ok: true,
  mensaje: 'Servidor activo',
  baseDeDatos: datos.estaConectado ? 'CONECTADA (Cloud Firestore)' : 'DESCONECTADA'
}));

// --- Arranque ----------------------------------------------------------------
if (require.main === module) {
  const iniciar = async () => {
    if (datos.estaConectado) {
      try {
        await datos.cargarDesdeFirestore();
      } catch (err) {
        console.error('Error cargando datos desde Firestore:', err.message);
      }
    } else {
      console.warn('⚠ ATENCION: Servidor en modo DESCONECTADO (sin base de datos)');
    }

    app.listen(PUERTO, () => {
      console.log('============================================');
      console.log('  Taller Mecanico - Sistema Web');
      console.log('  Base de Datos: ' + (datos.estaConectado ? 'Google Cloud Firestore' : 'DESCONECTADA (USE_FIREBASE=false)'));
      console.log('  Servidor en http://localhost:' + PUERTO);
      console.log('============================================');
    });
  };

  iniciar();
}

module.exports = app;

