// Rutas del CRUD de servicios:  /api/servicios/...
const express = require('express');
const c = require('../controllers/servicios.controller');

const router = express.Router();

router.get   ('/',        c.listar);
router.post  ('/',        c.crear);
router.put   ('/:codigo', c.actualizar);
router.delete('/:codigo', c.eliminar);

module.exports = router;
