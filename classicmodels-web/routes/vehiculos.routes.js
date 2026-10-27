// Rutas del CRUD de vehiculos:  /api/vehiculos/...
const express = require('express');
const c = require('../controllers/vehiculos.controller');

const router = express.Router();

router.get   ('/',        c.listar);
router.post  ('/',        c.crear);
router.put   ('/:placa',  c.actualizar);
router.delete('/:placa',  c.eliminar);

module.exports = router;
