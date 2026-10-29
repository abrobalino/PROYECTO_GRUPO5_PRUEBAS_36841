// =============================================================================
// PRUEBAS CON JEST: ÓRDENES (/api/ordenes)
// =============================================================================

const request = require('supertest');
const app = require('../server');

describe('Pruebas de la API de Órdenes de Trabajo (/api/ordenes)', () => {

  describe('GET /api/ordenes', () => {
    it('Debe listar todas las órdenes con campos calculados y enriquecidos', async () => {
      const res = await request(app).get('/api/ordenes');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
      expect(res.body.datos.length).toBeGreaterThan(0);
    });

    it('Debe filtrar órdenes por estado (?estado=)', async () => {
      const res = await request(app).get('/api/ordenes?estado=ENTREGADA');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /api/ordenes/:numero', () => {
    it('Debe obtener una orden específica por su número', async () => {
      const res = await request(app).get('/api/ordenes/1001');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.numero).toBe(1001);
    });

    it('Debe retornar 404 si la orden no existe', async () => {
      const res = await request(app).get('/api/ordenes/99999');

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('POST /api/ordenes', () => {
    it('Debe crear una nueva orden de trabajo con cabecera y detalle válidos', async () => {
      const nuevaOrden = {
        fecha: '2026-10-28',
        placa: 'PEF-9012',
        mecanicoId: 3,
        estado: 'PENDIENTE',
        observaciones: 'Prueba unitaria Jest',
        detalle: [
          { codigoServicio: 'SRV-001', cantidad: 1 },
          { codigoServicio: 'SRV-002', cantidad: 2 }
        ]
      };

      const res = await request(app)
        .post('/api/ordenes')
        .send(nuevaOrden);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('numero');
    });

    it('Debe fallar con 400 si el vehículo no existe', async () => {
      const res = await request(app)
        .post('/api/ordenes')
        .send({
          placa: 'XYZ-0000',
          mecanicoId: 2,
          fecha: '2026-10-28',
          detalle: [{ codigoServicio: 'SRV-001', cantidad: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el mecánico no existe', async () => {
      const res = await request(app)
        .post('/api/ordenes')
        .send({
          placa: 'PBA-1234',
          mecanicoId: 9999,
          fecha: '2026-10-28',
          detalle: [{ codigoServicio: 'SRV-001', cantidad: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el mecánico está inactivo', async () => {
      const res = await request(app)
        .post('/api/ordenes')
        .send({
          placa: 'PBA-1234',
          mecanicoId: 5,
          fecha: '2026-10-28',
          detalle: [{ codigoServicio: 'SRV-001', cantidad: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si no se incluye detalle de servicios', async () => {
      const res = await request(app)
        .post('/api/ordenes')
        .send({
          placa: 'PBA-1234',
          mecanicoId: 3,
          fecha: '2026-10-28',
          detalle: []
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('PUT /api/ordenes/:numero', () => {
    it('Debe rechazar con 400 si la orden ya fue entregada', async () => {
      const res = await request(app)
        .put('/api/ordenes/1001')
        .send({ observaciones: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe retornar 404 si la orden no existe', async () => {
      const res = await request(app)
        .put('/api/ordenes/99999')
        .send({ observaciones: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

});
