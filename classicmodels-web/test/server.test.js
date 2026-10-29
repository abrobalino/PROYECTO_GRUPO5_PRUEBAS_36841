// =============================================================================
// PRUEBAS CON JEST: SERVIDOR Y CONTROL DE CONEXION (/api/ping y Middleware 503)
// =============================================================================

const request = require('supertest');
const datos = require('../datos');
const app = require('../server');

describe('Pruebas del Servidor y Estado de Base de Datos', () => {
  it('GET /api/ping debe responder 200 con el estado del servidor y base de datos', async () => {
    const res = await request(app).get('/api/ping');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mensaje).toBe('Servidor activo');
    expect(res.body).toHaveProperty('baseDeDatos');
  });

  it('Debe responder 503 (DATABASE_DISCONNECTED) si la base de datos no esta conectada', async () => {
    const spyConectado = jest.spyOn(datos, 'estaConectado', 'get').mockReturnValue(false);

    const res = await request(app).get('/api/clientes');

    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('DATABASE_DISCONNECTED');
    expect(res.body.mensaje).toContain('no hay conexion con la base de datos');

    spyConectado.mockRestore();
  });

  it('Debe responder 503 (DATABASE_UNAVAILABLE) si falla la carga desde Firestore', async () => {
    const spyCargados = jest.spyOn(datos, 'cargados', 'get').mockReturnValue(false);
    const spyCargar = jest.spyOn(datos, 'cargarDesdeFirestore').mockRejectedValue(new Error('Falla de red simulada'));

    const res = await request(app).get('/api/clientes');

    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('DATABASE_UNAVAILABLE');
    expect(res.body.mensaje).toContain('Falla de red simulada');

    spyCargados.mockRestore();
    spyCargar.mockRestore();
  });
});

