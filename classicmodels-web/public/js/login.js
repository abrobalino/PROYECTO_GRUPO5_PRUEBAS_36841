// ===========================================================================
// login.js  -  PANTALLA DE ACCESO
// ===========================================================================

// Alterna entre el formulario de login y el de registro
function cambiarVista(vista) {
  document.getElementById('seccion-login').classList.toggle('oculto', vista !== 'login');
  document.getElementById('seccion-registro').classList.toggle('oculto', vista !== 'registro');
  document.getElementById('aviso').classList.add('oculto');
}

// ---------------------------------------------------------------------------
async function iniciarSesion() {
  const usuario  = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value;

  if (!usuario || !password) {
    return avisar('Ingrese usuario y contrasena', true);
  }

  const r = await API.post('/api/auth/login', { usuario, password });

  if (r.ok) {
    window.location.href = 'app.html';
  } else {
    avisar(r.mensaje, true);
  }
}

// ---------------------------------------------------------------------------
async function registrarUsuario() {
  const datos = {
    usuario:  document.getElementById('reg-usuario').value.trim(),
    password: document.getElementById('reg-password').value,
    rol:      document.getElementById('reg-rol').value,
    empleado: document.getElementById('reg-empleado').value || null
  };

  if (!datos.usuario || !datos.password) {
    return avisar('Complete usuario y contrasena', true);
  }

  const r = await API.post('/api/auth/registro', datos);

  if (r.ok) {
    avisar('Cuenta creada. Ya puede iniciar sesion.');
    document.getElementById('login-usuario').value = datos.usuario;
    setTimeout(() => cambiarVista('login'), 1200);
  } else {
    avisar(r.mensaje, true);
  }
}

// Permite entrar pulsando la tecla Enter
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (!document.getElementById('seccion-login').classList.contains('oculto')) {
    iniciarSesion();
  } else {
    registrarUsuario();
  }
});
