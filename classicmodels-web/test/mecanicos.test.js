// =============================================================================
// PRUEBAS CON JEST: MECÁNICOS (/api/mecanicos)
// =============================================================================

const request = require('supertest');
const app = require('../server');

describe('Pruebas de la API de Mecánicos (/api/mecanicos)', () => {

  describe('GET /api/mecanicos', () => {
    it('Debe listar todos los mecánicos sin exponer contraseñas', async () => {
      const res = await request(app).get('/api/mecanicos');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
      expect(res.body.datos.length).toBeGreaterThan(0);

      res.body.datos.forEach(m => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('nombres');
        expect(m.password).toBeUndefined();
      });
    });

    it('Debe filtrar solo mecánicos activos si se pasa ?activos=1', async () => {
      const res = await request(app).get('/api/mecanicos?activos=1');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('POST /api/mecanicos', () => {
    it('Debe registrar un nuevo mecánico correctamente', async () => {
      const nuevoMecanico = {
        nombres: 'Esteban Paredes',
        especialidad: 'Inyección electrónica',
        usuario: 'eparedes_jest',
        password: 'password123',
        rol: 'MECANICO'
      };

      const res = await request(app)
        .post('/api/mecanicos')
        .send(nuevoMecanico);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('id');
    });

    it('Debe fallar con 400 si faltan nombres o especialidad', async () => {
      const res = await request(app)
        .post('/api/mecanicos')
        .send({
          usuario: 'testuser',
          password: 'password123',
          rol: 'MECANICO'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el usuario tiene menos de 4 caracteres', async () => {
      const res = await request(app)
        .post('/api/mecanicos')
        .send({
          nombres: 'Prueba Corto',
          especialidad: 'Frenos',
          usuario: 'abc',
          password: 'password123',
          rol: 'MECANICO'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si la contraseña tiene menos de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/mecanicos')
        .send({
          nombres: 'Prueba Pass',
          especialidad: 'Frenos',
          usuario: 'mecanico_test',
          password: '123',
          rol: 'MECANICO'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el rol no es válido', async () => {
      const res = await request(app)
        .post('/api/mecanicos')
        .send({
          nombres: 'Prueba Rol',
          especialidad: 'Frenos',
          usuario: 'mecanico_rol',
          password: 'password123',
          rol: 'SUPERUSUARIO'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('Debe fallar con 400 si el usuario ya existe', async () => {
      const res = await request(app)
        .post('/api/mecanicos')
        .send({
          nombres: 'Otro Admin',
          especialidad: 'Dirección',
          usuario: 'admin',
          password: 'password123',
          rol: 'ADMIN'
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('PUT /api/mecanicos/:id', () => {
    it('Debe actualizar los datos de un mecánico existente', async () => {
      const res = await request(app)
        .put('/api/mecanicos/2')
        .send({ especialidad: 'Motor y Transmisión' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('Debe retornar 404 si el mecánico no existe', async () => {
      const res = await request(app)
        .put('/api/mecanicos/9999')
        .send({ nombres: 'No Existe' });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
    });
  });

});
