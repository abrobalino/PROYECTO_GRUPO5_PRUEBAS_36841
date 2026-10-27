// Rutas de consultas:  /api/consultas/...
const express = require('express');
const c = require('../controllers/consultas.controller');

const router = express.Router();

router.get('/ordenes-cliente', c.ordenesPorCliente);
router.get('/ordenes-fechas',  c.ordenesPorFechas);

module.exports = router;
