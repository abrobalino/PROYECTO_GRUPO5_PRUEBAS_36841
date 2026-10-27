// Rutas de consultas y reportes:  /api/reportes/...
const express = require('express');
const c = require('../controllers/reportes.controller');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

router.use(requiereLogin);

router.get('/ventas-cliente', c.ventasPorCliente);
router.get('/ventas-fechas',  c.ventasPorFechas);
router.get('/vista/:nombre',  c.vista);

module.exports = router;
