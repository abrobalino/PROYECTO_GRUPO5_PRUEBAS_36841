// =============================================================================
// server.js  -  ARRANQUE DEL SERVIDOR
// =============================================================================
// Orden de las operaciones:
//   1. Cargar la configuracion del archivo .env
//   2. Abrir el pool de conexiones con Oracle
//   3. Configurar Express (JSON, sesiones, archivos estaticos)
//   4. Registrar las rutas de la API
//   5. Empezar a escuchar peticiones
// =============================================================================

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./db');

const app    = express();
const PUERTO = process.env.PORT || 3000;

// --- Configuracion de Express ------------------------------------------------

// Permite leer el JSON que envia el navegador en req.body
app.use(express.json());

// Sesiones guardadas en una cookie del navegador
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }      // la sesion dura 1 hora
}));

// Sirve el frontend (carpeta public) desde el MISMO servidor.
// Al estar todo en el mismo origen, no hay problemas de CORS.
app.use(express.static(path.join(__dirname, 'public')));

// --- Rutas de la API ---------------------------------------------------------
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/clientes',  require('./routes/clientes.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/reportes',  require('./routes/reportes.routes'));

// Ruta de prueba para comprobar que el servidor responde
app.get('/api/ping', (req, res) => res.json({ ok: true, mensaje: 'Servidor activo' }));

// --- Arranque ----------------------------------------------------------------
async function iniciar() {
  try {
    await db.iniciarPool();
    app.listen(PUERTO, () => {
      console.log('============================================');
      console.log('  Classic Models - Sistema Web');
      console.log('  Servidor en http://localhost:' + PUERTO);
      console.log('============================================');
    });
  } catch (e) {
    console.error('No se pudo iniciar el servidor:', e.message);
    process.exit(1);
  }
}

// Cierra el pool ordenadamente al detener el servidor con Ctrl+C
process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  try { await db.cerrarPool(); } catch (e) { /* ignorar */ }
  process.exit(0);
});

iniciar();
