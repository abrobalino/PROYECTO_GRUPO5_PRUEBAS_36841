// =============================================================================
// PRUEBAS CON JEST: VEHÍCULOS (/api/vehiculos)
// =============================================================================
// Archivo de pruebas para la API de Vehículos.
//
// Endpoints a probar:
//   - GET    /api/vehiculos          -> Listar vehículos (con o sin filtro ?busqueda=)
//   - POST   /api/vehiculos          -> Registrar un nuevo vehículo
//   - DELETE /api/vehiculos/:placa   -> Eliminar un vehículo
// =============================================================================

const request = require('supertest');

// Los datos estan en memoria (datos.js): cada prueba recarga la app para
// empezar siempre con los datos originales.
let app;
beforeEach(() => {
  jest.resetModules();
  app = require('../server');
});

// Vehiculo valido que se reutiliza en las pruebas
const nuevoVehiculo = {
  placa: 'PZZ-0001',
  marca: 'Renault',
  modelo: 'Logan',
  anio: 2022,
  cedulaCliente: '1712345678'
};

describe('Pruebas de la API de Vehículos (/api/vehiculos)', () => {

  describe('POST /api/vehiculos', () => {
    it('Debe registrar un nuevo vehiculo correctamente', async () => {
      const res = await request(app).post('/api/vehiculos').send(nuevoVehiculo);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.placa).toBe('PZZ-0001');
      expect(res.body.mensaje).toBe('Vehiculo creado');
    });

    it('Debe guardar la placa en mayusculas', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, placa: 'pzz-0002' });

      expect(res.status).toBe(200);
      expect(res.body.placa).toBe('PZZ-0002');
    });

    it('Debe fallar con 400 si la placa no tiene el formato ABC-1234', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, placa: 'ABC123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'La placa debe tener el formato ABC-1234');
    });

    it('Debe fallar con 400 si falta la marca', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, marca: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Indique la marca');
    });

    it('Debe fallar con 400 si falta el modelo', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, modelo: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Indique el modelo');
    });

    it('Debe fallar con 400 si el anio no es valido', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, anio: 1900 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El anio no es valido');
    });

    it('Debe fallar con 400 si el cliente dueno no existe', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, cedulaCliente: '1700000000' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'El cliente dueno no existe');
    });

    it('Debe fallar con 400 si la placa ya existe', async () => {
      const res = await request(app).post('/api/vehiculos').send({ ...nuevoVehiculo, placa: 'PBA-1234' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'Ya existe un vehiculo con esa placa');
    });

    it('Debe fallar con 400 si no se envia la placa', async () => {
      const { placa, ...sinPlaca } = nuevoVehiculo;
      const res = await request(app).post('/api/vehiculos').send(sinPlaca);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'La placa debe tener el formato ABC-1234');
    });
  });

  describe('DELETE /api/vehiculos/:placa', () => {
    it('Debe eliminar un vehiculo sin ordenes', async () => {
      // El Nissan Sentra (PMN-6789) no tiene ordenes en datos.js
      const res = await request(app).delete('/api/vehiculos/PMN-6789');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Vehiculo eliminado');

      // Verificar que ya no aparece en el listado
      const lista = await request(app).get('/api/vehiculos?busqueda=PMN-6789');
      expect(lista.body.datos).toEqual([]);
    });

    it('No debe eliminar un vehiculo que tiene ordenes', async () => {
      // El Chevrolet Aveo (PBA-1234) tiene la orden 1001
      const res = await request(app).delete('/api/vehiculos/PBA-1234');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensaje', 'No se puede eliminar: el vehiculo tiene ordenes de trabajo');
    });

    it('Debe retornar 404 si el vehiculo no existe', async () => {
      const res = await request(app).delete('/api/vehiculos/XXX-0000');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensaje', 'Vehiculo no encontrado');
    });
  });

  describe('GET /api/vehiculos', () => {
    it('Debe listar todos los vehiculos', async () => {
      const res = await request(app).get('/api/vehiculos');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.datos)).toBe(true);
    });

    it('Debe filtrar vehiculos por cliente', async () => {
      const res = await request(app).get('/api/vehiculos?cliente=1712345678');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      res.body.datos.forEach(v => expect(v.cedulaCliente).toBe('1712345678'));
    });
  });

  describe('PUT /api/vehiculos/:placa', () => {
    it('Debe actualizar un vehiculo existente', async () => {
      const res = await request(app)
        .put('/api/vehiculos/PBA-1234')
        .send({ marca: 'Chevrolet', modelo: 'Aveo Emotion', anio: 2016, cedulaCliente: '1712345678' });
      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Vehiculo actualizado');
    });

    it('Debe fallar con 404 si el vehiculo no existe', async () => {
      const res = await request(app)
        .put('/api/vehiculos/ZZZ-9999')
        .send({ marca: 'Toyota', modelo: 'Yaris', anio: 2020, cedulaCliente: '1712345678' });
      expect(res.status).toBe(404);
      expect(res.body.mensaje).toBe('Vehiculo no encontrado');
    });
  });
});
