// Rutas del CRUD de mecanicos:  /api/mecanicos/...
const express = require('express');
const c = require('../controllers/mecanicos.controller');

const router = express.Router();

router.get   ('/',    c.listar);
router.post  ('/',    c.crear);
router.put   ('/:id', c.actualizar);
router.delete('/:id', c.eliminar);

module.exports = router;
