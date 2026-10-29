// =============================================================================
// PRUEBAS CON JEST: CLIENTES (/api/clientes)
// =============================================================================
// Archivo de pruebas para la API de Clientes.
//
// Endpoints a probar:
//   - GET    /api/clientes           -> Listar clientes (con o sin filtro ?busqueda=)
//   - POST   /api/clientes           -> Registrar un nuevo cliente
//   - DELETE /api/clientes/:cedula   -> Eliminar un cliente
// =============================================================================

const request = require('supertest');

// Los datos estan en memoria (datos.js): cada prueba recarga la app para
// empezar siempre con los datos originales.
let app;
beforeEach(() => {
  jest.resetModules();
  app = require('../server');
});

// Cliente valido que se reutiliza en las pruebas
const nuevoCliente = {
  cedula: '1799999999',
  nombres: 'Cliente Prueba',
  telefono: '0999999999',
  email: 'prueba@correo.com',
  direccion: 'Av. Prueba 123'
};

describe('Pruebas de la API de Clientes (/api/clientes)', () => {

  describe('GET /api/clientes', () => {
    it('Debe listar todos los clientes con su numero de vehiculos', async () => {
      const res = await request(app).get('/api/clientes');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos).toHaveLength(6);
      res.body.datos.forEach(c => expect(c).toHaveProperty('vehiculos'));
    });

    it('Debe filtrar por nombre sin importar tildes', async () => {
      const res = await request(app).get('/api/clientes?busqueda=lopez');

      expect(res.status).toBe(200);
      expect(res.body.datos).toHaveLength(1);
      expect(res.body.datos[0].cedula).toBe('1712345678');
      expect(res.body.datos[0].vehiculos).toBe(2);
    });
  });

  describe('POST /api/clientes', () => {
    it('Debe registrar un nuevo cliente correctamente', async () => {
      const res = await request(app).post('/api/clientes').send(nuevoCliente);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.cedula).toBe('1799999999');
      expect(res.body.mensaje).toBe('Cliente creado');

      // Verificar que ahora aparece en el listado
      const lista = await request(app).get('/api/clientes?busqueda=1799999999');
      expect(lista.body.datos).toHaveLength(1);
    });

    it('Debe fallar con 400 si la cedula no tiene 10 digitos', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, cedula: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'La cedula debe tener 10 digitos');
    });

    it('Debe fallar con 400 si faltan los nombres', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, nombres: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Indique los nombres');
    });

    it('Debe fallar con 400 si el telefono no es valido', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, telefono: '12ab' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El telefono debe tener entre 7 y 10 digitos');
    });

    it('Debe fallar con 400 si el email no es valido', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, email: 'correo-malo' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El email no es valido');
    });

    it('Debe fallar con 400 si el email tiene espacios o dominio sin punto', async () => {
      const conEspacio = await request(app).post('/api/clientes').send({ ...nuevoCliente, email: 'a b@correo.com' });
      const sinPunto   = await request(app).post('/api/clientes').send({ ...nuevoCliente, email: 'a@correo' });

      expect(conEspacio.status).toBe(400);
      expect(sinPunto.status).toBe(400);
      expect(sinPunto.body).toHaveProperty('mensaje', 'El email no es valido');
    });

    it('Debe fallar con 400 si falta la direccion', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, direccion: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Indique la direccion');
    });

    it('Debe fallar con 400 si no se envian cedula, telefono o email', async () => {
      const { cedula, ...sinCedula }     = nuevoCliente;
      const { telefono, ...sinTelefono } = nuevoCliente;
      const { email, ...sinEmail }       = nuevoCliente;

      const r1 = await request(app).post('/api/clientes').send(sinCedula);
      const r2 = await request(app).post('/api/clientes').send(sinTelefono);
      const r3 = await request(app).post('/api/clientes').send(sinEmail);

      expect(r1.body).toHaveProperty('mensaje', 'La cedula debe tener 10 digitos');
      expect(r2.body).toHaveProperty('mensaje', 'El telefono debe tener entre 7 y 10 digitos');
      expect(r3.body).toHaveProperty('mensaje', 'El email no es valido');
    });

    it('Debe fallar con 400 si el email no tiene usuario antes de la @', async () => {
      const res = await request(app).post('/api/clientes').send({ ...nuevoCliente, email: '@correo.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El email no es valido');
    });
  });

  describe('DELETE /api/clientes/:cedula', () => {
    it('No debe eliminar un cliente que tiene vehiculos', async () => {
      // Maria Fernanda Lopez (1712345678) tiene 2 vehiculos
      const res = await request(app).delete('/api/clientes/1712345678');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'No se puede eliminar: el cliente tiene vehiculos registrados');
    });

    it('Debe retornar 404 si el cliente no existe', async () => {
      const res = await request(app).delete('/api/clientes/1700000000');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Cliente no encontrado');
    });
  });
});
