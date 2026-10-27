// Rutas del CRUD de clientes:  /api/clientes/...
const express = require('express');
const c = require('../controllers/clientes.controller');
const { requiereLogin } = require('../middleware/auth');

const router = express.Router();

router.use(requiereLogin);          // todas estas rutas exigen sesion iniciada

router.get   ('/',        c.listar);
router.post  ('/',        c.crear);
router.put   ('/:codigo', c.actualizar);
router.delete('/:codigo', c.eliminar);

module.exports = router;
