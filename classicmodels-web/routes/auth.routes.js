// Rutas de autenticacion:  /api/auth/...
const express = require('express');
const c = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login',    c.login);
router.post('/registro', c.registro);
router.post('/logout',   c.logout);
router.get ('/sesion',   c.sesion);

module.exports = router;
