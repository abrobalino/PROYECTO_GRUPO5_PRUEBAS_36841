// Rutas del CRUD de ordenes:  /api/ordenes/...
const express = require('express');
const c = require('../controllers/ordenes.controller');

const router = express.Router();

router.get   ('/',        c.listar);
router.get   ('/:numero', c.obtener);
router.post  ('/',        c.crear);
router.put   ('/:numero', c.actualizar);
router.delete('/:numero', c.eliminar);

module.exports = router;
