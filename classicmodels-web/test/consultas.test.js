// =============================================================================
// PRUEBAS CON JEST: CONSULTAS (/api/consultas)
// =============================================================================
// Archivo de pruebas para los endpoints de consultas y reportes.
//
// Endpoints a probar:
//   - GET /api/consultas/ordenes-cliente  -> Consultar órdenes por cédula de cliente (?cedula=)
//   - GET /api/consultas/ordenes-fechas   -> Consultar órdenes por rango de fechas (?desde=&hasta=)
// =============================================================================

const request = require('supertest');
const app = require('../server');

describe('Pruebas de la API de Consultas (/api/consultas)', () => {

  describe('GET /api/consultas/ordenes-cliente', () => {
    it('Debe devolver las órdenes de un cliente con sus servicios resumidos', async () => {
      // Ricardo Montalvo (1745678901) tiene la orden 1004 con 2 amortiguadores
      const res = await request(app).get('/api/consultas/ordenes-cliente?cedula=1745678901');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos).toHaveLength(1);
      expect(res.body.datos[0].numero).toBe(1004);
      expect(res.body.datos[0].cliente).toBe('Ricardo Montalvo');
      expect(res.body.datos[0].servicios).toBe('Cambio de amortiguadores x2, Alineación y balanceo');
      expect(res.body.datos[0].total).toBe(275);
    });
  });

  describe('GET /api/consultas/ordenes-fechas', () => {
    it('Debe devolver las órdenes dentro del rango de fechas', async () => {
      const res = await request(app).get('/api/consultas/ordenes-fechas?desde=2026-09-01&hasta=2026-09-05');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos).toHaveLength(1);
      expect(res.body.datos[0].numero).toBe(1001);
    });

    it('Debe fallar con 400 si falta alguna de las fechas', async () => {
      const sinHasta  = await request(app).get('/api/consultas/ordenes-fechas?desde=2026-09-01');
      const sinNinguna = await request(app).get('/api/consultas/ordenes-fechas');

      expect(sinHasta.status).toBe(400);
      expect(sinNinguna.status).toBe(400);
      expect(sinHasta.body.mensaje).toBe('Indique las fechas desde y hasta');
    });
  });
});
