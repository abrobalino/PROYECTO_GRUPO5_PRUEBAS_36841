// =============================================================================
// server.js  -  ARRANQUE DEL SERVIDOR
// =============================================================================
// Orden de las operaciones:
//   1. Cargar la configuracion del archivo .env
//   2. Configurar Express (JSON y archivos estaticos)
//   3. Registrar las rutas de la API
//   4. Empezar a escuchar peticiones
//
// No hay base de datos: los datos estan quemados en datos.js
// No hay inicio de sesion: todas las rutas son publicas.
// =============================================================================

require('dotenv').config();

const express = require('express');
const path    = require('path');

const app    = express();
const PUERTO = process.env.PORT || 4000;

// --- Configuracion de Express ------------------------------------------------

// Permite leer el JSON que envia el navegador en req.body
app.use(express.json());

// Sirve el frontend (carpeta public) desde el MISMO servidor.
// Al estar todo en el mismo origen, no hay problemas de CORS.
app.use(express.static(path.join(__dirname, 'public')));

// --- Rutas de la API ---------------------------------------------------------
app.use('/api/clientes',  require('./routes/clientes.routes'));
app.use('/api/vehiculos', require('./routes/vehiculos.routes'));
app.use('/api/servicios', require('./routes/servicios.routes'));
app.use('/api/mecanicos', require('./routes/mecanicos.routes'));
app.use('/api/ordenes',   require('./routes/ordenes.routes'));
app.use('/api/consultas', require('./routes/consultas.routes'));

// Ruta de prueba para comprobar que el servidor responde
app.get('/api/ping', (req, res) => res.json({ ok: true, mensaje: 'Servidor activo' }));

// --- Arranque ----------------------------------------------------------------
app.listen(PUERTO, () => {
  console.log('============================================');
  console.log('  Taller Mecanico - Sistema Web');
  console.log('  Servidor en http://localhost:' + PUERTO);
  console.log('============================================');
});
