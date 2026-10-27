// =============================================================================
// test-api.js  -  PRUEBA DEL BACKEND SIN NAVEGADOR
// =============================================================================
// Ejecutar con:   node test-api.js
// (el servidor debe estar corriendo en otra ventana con: npm start)
//
// Recorre los principales endpoints y muestra si responden correctamente.
// =============================================================================

const BASE = 'http://localhost:3000';
let cookie = '';

async function pedir(metodo, ruta, cuerpo) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  };
  if (cuerpo) opciones.body = JSON.stringify(cuerpo);

  const r = await fetch(BASE + ruta, opciones);

  // Guardar la cookie de sesion que devuelve el login
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];

  return { estado: r.status, datos: await r.json() };
}

function mostrar(titulo, r) {
  const filas = Array.isArray(r.datos.datos) ? r.datos.datos.length : '-';
  console.log(`[${r.estado}] ${titulo}`);
  console.log(`      ok=${r.datos.ok}  filas=${filas}  mensaje=${r.datos.mensaje || ''}`);
}

async function main() {
  console.log('=== PRUEBAS DEL BACKEND ===\n');

  mostrar('GET  /api/ping', await pedir('GET', '/api/ping'));

  console.log('\n--- Sin sesion (debe dar 401) ---');
  mostrar('GET  /api/clientes', await pedir('GET', '/api/clientes'));

  console.log('\n--- Login ---');
  mostrar('POST /api/auth/login (clave incorrecta)',
    await pedir('POST', '/api/auth/login', { usuario: 'admin', password: 'mala' }));
  mostrar('POST /api/auth/login (correcto)',
    await pedir('POST', '/api/auth/login', { usuario: 'admin', password: 'admin123' }));

  console.log('\n--- CRUD y consultas (con sesion) ---');
  mostrar('GET  /api/clientes', await pedir('GET', '/api/clientes'));
  mostrar('GET  /api/clientes?busqueda=Euro', await pedir('GET', '/api/clientes?busqueda=Euro'));
  mostrar('GET  /api/productos', await pedir('GET', '/api/productos'));
  mostrar('GET  /api/reportes/ventas-cliente?codigo=141',
    await pedir('GET', '/api/reportes/ventas-cliente?codigo=141'));
  mostrar('GET  /api/reportes/ventas-fechas',
    await pedir('GET', '/api/reportes/ventas-fechas?desde=2004-01-01&hasta=2004-01-31'));

  console.log('\n--- Reportes (vistas) ---');
  for (const v of ['por-cliente','por-periodo','top-productos','stock-critico',
                   'por-oficina','estado-cuenta','auditoria']) {
    mostrar('GET  /api/reportes/vista/' + v, await pedir('GET', '/api/reportes/vista/' + v));
  }

  console.log('\n--- Crear, actualizar y eliminar un cliente ---');
  const creado = await pedir('POST', '/api/clientes', {
    nombre: 'Cliente API Prueba', contactoNom: 'Ana', contactoApe: 'Lopez',
    telefono: '02-9999999', direccion: 'Av. Prueba 1',
    ciudad: 'sangolqui', pais: 'ecuador', limite: 5000
  });
  mostrar('POST   /api/clientes', creado);

  const cod = creado.datos.codigo;
  if (cod) {
    mostrar('PUT    /api/clientes/' + cod,
      await pedir('PUT', '/api/clientes/' + cod, { limite: 8000 }));
    mostrar('DELETE /api/clientes/' + cod,
      await pedir('DELETE', '/api/clientes/' + cod));
  }

  console.log('\n--- Trigger BEFORE DELETE (debe rechazar) ---');
  mostrar('DELETE /api/clientes/141', await pedir('DELETE', '/api/clientes/141'));

  console.log('\n--- Logout ---');
  mostrar('POST /api/auth/logout', await pedir('POST', '/api/auth/logout'));

  console.log('\n=== FIN DE LAS PRUEBAS ===');
}

main().catch(e => console.error('Error:', e.message));
