// =============================================================================
// middleware/auth.js  -  PROTECCION DE RUTAS
// =============================================================================
// Un "middleware" es una funcion que se ejecuta ANTES del controlador.
// Aqui se comprueba que exista una sesion iniciada; si no, se corta la
// peticion con el codigo 401 (no autorizado) y el controlador nunca se ejecuta.
// =============================================================================

function requiereLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();              // hay sesion -> continuar
  }
  return res.status(401).json({ ok: false, mensaje: 'Debe iniciar sesion' });
}

function requiereAdmin(req, res, next) {
  if (req.session && req.session.usuario && req.session.usuario.rol === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ ok: false, mensaje: 'Requiere permisos de administrador' });
}

module.exports = { requiereLogin, requiereAdmin };
