// =============================================================================
// test-api.js  -  PRUEBA DEL BACKEND SIN NAVEGADOR
// =============================================================================
// Ejecutar con:   node test-api.js
// (el servidor debe estar corriendo en otra ventana con: npm start)
//
// Recorre los principales endpoints y muestra si responden correctamente.
// Como los datos estan en memoria, al final se borra lo que se creo.
// =============================================================================

const BASE = 'http://localhost:4000';

async function pedir(metodo, ruta, cuerpo) {
  const opciones = {
    method: metodo,
    headers: { 'Content-Type': 'application/json' }
  };
  if (cuerpo) opciones.body = JSON.stringify(cuerpo);

  const r = await fetch(BASE + ruta, opciones);
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

  console.log('\n--- Listados ---');
  for (const r of ['clientes', 'vehiculos', 'servicios', 'mecanicos', 'ordenes']) {
    mostrar('GET  /api/' + r, await pedir('GET', '/api/' + r));
  }
  mostrar('GET  /api/clientes?busqueda=lopez', await pedir('GET', '/api/clientes?busqueda=lopez'));

  console.log('\n--- Consultas ---');
  mostrar('GET  /api/consultas/ordenes-cliente?cedula=1712345678',
    await pedir('GET', '/api/consultas/ordenes-cliente?cedula=1712345678'));
  mostrar('GET  /api/consultas/ordenes-fechas (septiembre)',
    await pedir('GET', '/api/consultas/ordenes-fechas?desde=2026-09-01&hasta=2026-09-30'));

  console.log('\n--- Flujo completo: cliente -> vehiculo -> orden ---');
  mostrar('POST   /api/clientes', await pedir('POST', '/api/clientes', {
    cedula: '1799999999', nombres: 'Cliente API Prueba', telefono: '0999999999',
    email: 'prueba@correo.com', direccion: 'Av. Prueba 1'
  }));
  mostrar('POST   /api/clientes (cedula invalida)', await pedir('POST', '/api/clientes', {
    cedula: '123', nombres: 'X', telefono: '0999999999', email: 'x@x.com', direccion: 'X'
  }));
  mostrar('POST   /api/vehiculos', await pedir('POST', '/api/vehiculos', {
    placa: 'PZZ-0001', marca: 'Renault', modelo: 'Logan', anio: 2022, cedulaCliente: '1799999999'
  }));

  const orden = await pedir('POST', '/api/ordenes', {
    placa: 'PZZ-0001', mecanicoId: 2, observaciones: 'Prueba',
    detalle: [{ codigoServicio: 'SRV-001', cantidad: 1 }, { codigoServicio: 'SRV-005', cantidad: 1 }]
  });
  mostrar('POST   /api/ordenes', orden);
  const num = orden.datos.numero;

  mostrar('POST   /api/ordenes (mecanico inactivo)', await pedir('POST', '/api/ordenes', {
    placa: 'PZZ-0001', mecanicoId: 5, detalle: [{ codigoServicio: 'SRV-001', cantidad: 1 }]
  }));
  mostrar('POST   /api/ordenes (sin servicios)', await pedir('POST', '/api/ordenes', {
    placa: 'PZZ-0001', mecanicoId: 2, detalle: []
  }));

  if (num) {
    mostrar('PUT    /api/ordenes/' + num + ' (EN PROCESO)',
      await pedir('PUT', '/api/ordenes/' + num, { estado: 'EN PROCESO' }));
    mostrar('PUT    /api/ordenes/' + num + ' (retroceder, debe rechazar)',
      await pedir('PUT', '/api/ordenes/' + num, { estado: 'PENDIENTE' }));
    mostrar('DELETE /api/ordenes/' + num + ' (no pendiente, debe rechazar)',
      await pedir('DELETE', '/api/ordenes/' + num));
  }

  console.log('\n--- Reglas de eliminacion (deben rechazar) ---');
  mostrar('DELETE /api/clientes/1799999999 (tiene vehiculo)', await pedir('DELETE', '/api/clientes/1799999999'));
  mostrar('DELETE /api/vehiculos/PBA-1234 (tiene ordenes)',   await pedir('DELETE', '/api/vehiculos/PBA-1234'));
  mostrar('DELETE /api/servicios/SRV-001 (usado en ordenes)', await pedir('DELETE', '/api/servicios/SRV-001'));

  console.log('\n=== FIN DE LAS PRUEBAS ===');
  console.log('(Reinicie el servidor para volver a los datos originales)');
}

main().catch(e => console.error('Error:', e.message));
