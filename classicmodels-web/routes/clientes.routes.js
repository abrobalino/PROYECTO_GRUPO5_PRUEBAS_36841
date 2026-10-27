// Rutas del CRUD de clientes:  /api/clientes/...
const express = require('express');
const c = require('../controllers/clientes.controller');

const router = express.Router();

router.get   ('/',        c.listar);
router.post  ('/',        c.crear);
router.put   ('/:cedula', c.actualizar);
router.delete('/:cedula', c.eliminar);

module.exports = router;
