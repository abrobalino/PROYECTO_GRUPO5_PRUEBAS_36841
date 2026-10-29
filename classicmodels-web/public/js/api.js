// ===========================================================================
// api.js  -  COMUNICACION CON EL BACKEND
// ===========================================================================
// Todas las llamadas de la aplicacion pasan por aqui. Centralizarlas evita
// repetir el manejo de errores en cada pantalla.
// ===========================================================================

const API = {

  // Peticion generica. Devuelve siempre un objeto { ok, ... }
  async pedir(ruta, metodo = 'GET', cuerpo = null) {
    const opciones = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' }
    };
    if (cuerpo) opciones.body = JSON.stringify(cuerpo);

    try {
      const respuesta = await fetch(ruta, opciones);
      return await respuesta.json();

    } catch (error) {
      console.error('No se pudo conectar con el servidor:', error);
      return { ok: false, mensaje: 'No se pudo conectar con el servidor' };
    }
  },

  get:    (ruta)          => API.pedir(ruta, 'GET'),
  post:   (ruta, cuerpo)  => API.pedir(ruta, 'POST', cuerpo),
  put:    (ruta, cuerpo)  => API.pedir(ruta, 'PUT', cuerpo),
  borrar: (ruta)          => API.pedir(ruta, 'DELETE')
};

// ---------------------------------------------------------------------------
// Muestra un mensaje temporal en pantalla
// ---------------------------------------------------------------------------
function avisar(texto, esError = false) {
  const caja = document.getElementById('aviso');
  if (!caja) { alert(texto); return; }

  caja.textContent = texto;
  caja.className = 'aviso flotante ' + (esError ? 'aviso-error' : 'aviso-ok');

  clearTimeout(window._temporizadorAviso);
  window._temporizadorAviso = setTimeout(() => caja.classList.add('oculto'), 5000);
}
