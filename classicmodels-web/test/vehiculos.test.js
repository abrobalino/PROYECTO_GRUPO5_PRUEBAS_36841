// =============================================================================
// PRUEBAS CON JEST: VEHÍCULOS (/api/vehiculos)
// =============================================================================
// Archivo de pruebas para la API de Vehículos.
//
// Endpoints a probar:
//   - GET    /api/vehiculos          -> Listar vehículos (con o sin filtro ?busqueda=)
//   - POST   /api/vehiculos          -> Registrar un nuevo vehículo
//   - PUT    /api/vehiculos/:placa   -> Actualizar datos de un vehículo
//   - DELETE /api/vehiculos/:placa   -> Eliminar un vehículo
// =============================================================================

describe('Pruebas de la API de Vehículos (/api/vehiculos)', () => {
  test.todo('GET /api/vehiculos - Listar vehículos');
  test.todo('POST /api/vehiculos - Registrar vehículo');
  test.todo('PUT /api/vehiculos/:placa - Actualizar vehículo');
  test.todo('DELETE /api/vehiculos/:placa - Eliminar vehículo');
});
