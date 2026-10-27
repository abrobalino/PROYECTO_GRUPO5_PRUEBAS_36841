// =============================================================================
// controllers/auth.controller.js  -  LOGIN Y REGISTRO
// =============================================================================
// Cada funcion recibe la peticion (req), llama a un procedimiento de Oracle
// y responde en formato JSON. NO contiene reglas de negocio: esas estan
// dentro de los procedimientos almacenados.
// =============================================================================

const { ejecutar, OUT } = require('../db');

// POST /api/auth/login
async function login(req, res) {
  const { usuario, password } = req.body;

  try {
    const r = await ejecutar(
      `BEGIN sp_login(:usuario, :password, :id, :rol, :nombre, :mensaje); END;`,
      {
        usuario, password,
        id:      OUT.numero,
        rol:     OUT.texto,
        nombre:  OUT.texto,
        mensaje: OUT.texto
      }
    );

    if (r.mensaje !== 'OK') {
      return res.status(401).json({ ok: false, mensaje: r.mensaje });
    }

    // Se guardan los datos del usuario en la sesion (cookie del navegador)
    req.session.usuario = { id: r.id, usuario, rol: r.rol, nombre: r.nombre };

    res.json({ ok: true, usuario: req.session.usuario });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// POST /api/auth/registro
async function registro(req, res) {
  const { usuario, password, rol, empleado } = req.body;

  try {
    const r = await ejecutar(
      `BEGIN sp_registrar_usuario(:usuario, :password, :rol, :empleado, :id, :mensaje); END;`,
      {
        usuario,
        password,
        rol:      rol || 'VENDEDOR',
        empleado: empleado || null,
        id:       OUT.numero,
        mensaje:  OUT.texto
      }
    );

    if (r.mensaje !== 'OK') {
      return res.status(400).json({ ok: false, mensaje: r.mensaje });
    }
    res.json({ ok: true, id: r.id, mensaje: 'Usuario registrado correctamente' });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, mensaje: 'Error del servidor' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

// GET /api/auth/sesion
function sesion(req, res) {
  if (req.session && req.session.usuario) {
    return res.json({ ok: true, usuario: req.session.usuario });
  }
  res.json({ ok: false });
}

module.exports = { login, registro, logout, sesion };
