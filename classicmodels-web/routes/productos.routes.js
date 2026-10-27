// Rutas del CRUD de productos:  /api/productos/...
const express = require('express');
const c = require('../controllers/productos.controller');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

router.use(requiereLogin);

router.get   ('/',        c.listar);
router.post  ('/',        c.crear);
router.put   ('/:codigo', c.actualizar);
router.delete('/:codigo', c.eliminar);

module.exports = router;
