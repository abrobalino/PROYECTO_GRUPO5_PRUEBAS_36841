// =============================================================================
// PRUEBAS CON JEST: SERVICIOS (/api/servicios)
// =============================================================================

const request = require('supertest');
const app = require('../server');

describe('Pruebas de la API de Servicios (/api/servicios)', () => {

  describe('GET /api/servicios', () => {
    it('Debe listar todos los servicios registrados', async () => {
      const res = await request(app).get('/api/servicios');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
      expect(res.body.datos.length).toBeGreaterThan(0);
    });

    it('Debe filtrar servicios por término de búsqueda (?busqueda=)', async () => {
      const res = await request(app).get('/api/servicios?busqueda=aceite');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('POST /api/servicios', () => {
    it('Debe crear un nuevo servicio correctamente', async () => {
      const nuevoServicio = {
        nombre: 'Cambio de líquido de frenos Jest',
        descripcion: 'Purga y cambio completo',
        precio: 30.50,
        duracion: 40
      };

      const res = await request(app)
        .post('/api/servicios')
        .send(nuevoServicio);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.codigo).toMatch(/^SRV-\d{3}$/);
    });

    it('Debe fallar con 400 si falta el nombre', async () => {
      const res = await request(app)
        .post('/api/servicios')
        .send({ precio: 25, duracion: 30 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el precio es menor o igual a 0', async () => {
      const res = await request(app)
        .post('/api/servicios')
        .send({ nombre: 'Prueba', precio: 0, duracion: 30 });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('PUT /api/servicios/:codigo', () => {
    it('Debe actualizar un servicio existente exitosamente', async () => {
      const res = await request(app)
        .put('/api/servicios/SRV-001')
        .send({ precio: 50.00, duracion: 35 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.mensaje).toBe('Servicio actualizado');
    });
  });

  describe('Validaciones adicionales de servicios', () => {
    it('Debe fallar con 400 si la duración no es un entero positivo', async () => {
      const res = await request(app).post('/api/servicios')
        .send({ nombre: 'Lavado', precio: 10, duracion: 0 });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('La duracion debe ser un numero entero de minutos');
    });

    it('Debe crear un servicio sin descripción', async () => {
      const res = await request(app).post('/api/servicios')
        .send({ nombre: 'Lavado', precio: 10, duracion: 20 });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('Debe retornar 404 al actualizar un servicio que no existe', async () => {
      const res = await request(app).put('/api/servicios/SRV-999').send({ precio: 10 });

      expect(res.status).toBe(404);
      expect(res.body.mensaje).toBe('Servicio no encontrado');
    });

    it('Debe fallar con 400 al actualizar con un precio inválido', async () => {
      const res = await request(app).put('/api/servicios/SRV-001').send({ precio: -5 });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El precio debe ser mayor a 0');
    });

    it('Debe retornar 404 al eliminar un servicio que no existe', async () => {
      const res = await request(app).delete('/api/servicios/SRV-999');

      expect(res.status).toBe(404);
      expect(res.body.mensaje).toBe('Servicio no encontrado');
    });
  });

});
