// =============================================================================
// datos.js  -  DATOS QUEMADOS DEL TALLER MECANICO
// =============================================================================
// No hay base de datos: la informacion vive en estos 5 arreglos en memoria.
// Los controladores leen y modifican estos arreglos directamente.
//
// IMPORTANTE: los cambios (altas, ediciones, bajas) se pierden al reiniciar
// el servidor, porque todo vuelve a cargarse desde este archivo.
//
//   clientes        -> duenos de los vehiculos            (clave: cedula)
//   mecanicos       -> personal del taller + login         (clave: id)
//   servicios       -> catalogo con precio y duracion      (clave: codigo)
//   vehiculos       -> placa, marca, modelo, anio, dueno   (clave: placa)
//   ordenesTrabajo  -> la orden lleva su detalle adentro   (clave: numero)
// =============================================================================

const clientes = [
  { cedula: '1712345678', nombres: 'María Fernanda López',  telefono: '0991234567', email: 'mlopez@correo.com',   direccion: 'Av. General Enríquez y Calle Montúfar, Sangolquí' },
  { cedula: '1723456789', nombres: 'José Antonio Guerrero', telefono: '0987654321', email: 'jguerrero@correo.com', direccion: 'San Rafael, Calle Isla Floreana 120' },
  { cedula: '1734567890', nombres: 'Gabriela Salazar',      telefono: '0976543210', email: 'gsalazar@correo.com',  direccion: 'Conocoto, Av. Ilaló 45' },
  { cedula: '1745678901', nombres: 'Ricardo Montalvo',      telefono: '0965432109', email: 'rmontalvo@correo.com', direccion: 'Capelo, Calle Los Pinos 8' },
  { cedula: '1756789012', nombres: 'Paola Cevallos',        telefono: '0954321098', email: 'pcevallos@correo.com', direccion: 'Selva Alegre, Pasaje Las Rosas 3' },
  { cedula: '1767890123', nombres: 'Fernando Ortiz',        telefono: '0943210987', email: 'fortiz@correo.com',    direccion: 'Amaguaña, Av. Mariana de Jesús 210' }
];

// El login vive aqui: cada mecanico tiene usuario, password y rol.
// rol: ADMIN (jefe de taller) o MECANICO.
const mecanicos = [
  { id: 1, nombres: 'Carlos Andrade', especialidad: 'Jefe de taller',          activo: true,  usuario: 'admin',   password: process.env.ADMIN_PASSWORD,    rol: 'ADMIN' },
  { id: 2, nombres: 'Luis Pérez',     especialidad: 'Motor',                   activo: true,  usuario: 'lperez',  password: process.env.MECANICO_PASSWORD, rol: 'MECANICO' },
  { id: 3, nombres: 'Andrea Torres',  especialidad: 'Frenos y suspensión',     activo: true,  usuario: 'atorres', password: process.env.MECANICO_PASSWORD, rol: 'MECANICO' },
  { id: 4, nombres: 'Jorge Male',     especialidad: 'Electricidad automotriz', activo: true,  usuario: 'jmale',   password: process.env.MECANICO_PASSWORD, rol: 'MECANICO' },
  { id: 5, nombres: 'Diego Vaca',     especialidad: 'Enderezada y pintura',    activo: false, usuario: 'dvaca',   password: process.env.MECANICO_PASSWORD, rol: 'MECANICO' }
];

// duracion en minutos
const servicios = [
  { codigo: 'SRV-001', nombre: 'Cambio de aceite y filtro',   descripcion: 'Aceite sintético 5W-30 y filtro nuevo',     precio: 45.00,  duracion: 30 },
  { codigo: 'SRV-002', nombre: 'Alineación y balanceo',       descripcion: 'Alineación computarizada de 4 ruedas',      precio: 35.00,  duracion: 45 },
  { codigo: 'SRV-003', nombre: 'Cambio de pastillas de freno', descripcion: 'Pastillas delanteras, incluye mano de obra', precio: 60.00,  duracion: 60 },
  { codigo: 'SRV-004', nombre: 'ABC de motor',                descripcion: 'Bujías, filtros de aire y combustible',     precio: 80.00,  duracion: 90 },
  { codigo: 'SRV-005', nombre: 'Diagnóstico por escáner',     descripcion: 'Lectura de códigos de falla OBD2',          precio: 25.00,  duracion: 20 },
  { codigo: 'SRV-006', nombre: 'Cambio de batería',           descripcion: 'Instalación y prueba del sistema de carga', precio: 20.00,  duracion: 15 },
  { codigo: 'SRV-007', nombre: 'Cambio de amortiguadores',    descripcion: 'Par de amortiguadores, mano de obra',       precio: 120.00, duracion: 120 },
  { codigo: 'SRV-008', nombre: 'Lavado de inyectores',        descripcion: 'Limpieza por ultrasonido',                  precio: 55.00,  duracion: 60 }
];

const vehiculos = [
  { placa: 'PBA-1234', marca: 'Chevrolet', modelo: 'Aveo',     anio: 2015, cedulaCliente: '1712345678' },
  { placa: 'PCD-5678', marca: 'Kia',       modelo: 'Sportage', anio: 2020, cedulaCliente: '1712345678' },
  { placa: 'PEF-9012', marca: 'Toyota',    modelo: 'Hilux',    anio: 2018, cedulaCliente: '1723456789' },
  { placa: 'PGH-3456', marca: 'Hyundai',   modelo: 'Tucson',   anio: 2021, cedulaCliente: '1734567890' },
  { placa: 'PIJ-7890', marca: 'Mazda',     modelo: 'CX-5',     anio: 2019, cedulaCliente: '1745678901' },
  { placa: 'PKL-2345', marca: 'Suzuki',    modelo: 'Vitara',   anio: 2016, cedulaCliente: '1756789012' },
  { placa: 'PMN-6789', marca: 'Nissan',    modelo: 'Sentra',   anio: 2017, cedulaCliente: '1756789012' }
];

// estado: PENDIENTE -> EN PROCESO -> TERMINADA -> ENTREGADA
// El detalle guarda nombre y precio del servicio al momento de la orden,
// asi un cambio de precio en el catalogo no altera las ordenes anteriores.
const ordenesTrabajo = [
  {
    numero: 1001, fecha: '2026-09-02', placa: 'PBA-1234', mecanicoId: 2, estado: 'ENTREGADA',
    observaciones: 'Mantenimiento de los 80.000 km',
    detalle: [
      { codigoServicio: 'SRV-001', nombre: 'Cambio de aceite y filtro', precio: 45.00, cantidad: 1 },
      { codigoServicio: 'SRV-004', nombre: 'ABC de motor',              precio: 80.00, cantidad: 1 }
    ]
  },
  {
    numero: 1002, fecha: '2026-09-10', placa: 'PEF-9012', mecanicoId: 3, estado: 'ENTREGADA',
    observaciones: 'Ruido al frenar',
    detalle: [
      { codigoServicio: 'SRV-003', nombre: 'Cambio de pastillas de freno', precio: 60.00, cantidad: 1 },
      { codigoServicio: 'SRV-002', nombre: 'Alineación y balanceo',        precio: 35.00, cantidad: 1 }
    ]
  },
  {
    numero: 1003, fecha: '2026-09-21', placa: 'PGH-3456', mecanicoId: 4, estado: 'ENTREGADA',
    observaciones: 'No enciende en las mañanas',
    detalle: [
      { codigoServicio: 'SRV-005', nombre: 'Diagnóstico por escáner', precio: 25.00, cantidad: 1 },
      { codigoServicio: 'SRV-006', nombre: 'Cambio de batería',       precio: 20.00, cantidad: 1 }
    ]
  },
  {
    numero: 1004, fecha: '2026-10-05', placa: 'PIJ-7890', mecanicoId: 3, estado: 'TERMINADA',
    observaciones: 'Golpeteo en la suspensión trasera',
    detalle: [
      { codigoServicio: 'SRV-007', nombre: 'Cambio de amortiguadores', precio: 120.00, cantidad: 2 },
      { codigoServicio: 'SRV-002', nombre: 'Alineación y balanceo',    precio: 35.00,  cantidad: 1 }
    ]
  },
  {
    numero: 1005, fecha: '2026-10-18', placa: 'PCD-5678', mecanicoId: 2, estado: 'EN PROCESO',
    observaciones: 'Pierde potencia en subidas',
    detalle: [
      { codigoServicio: 'SRV-005', nombre: 'Diagnóstico por escáner', precio: 25.00, cantidad: 1 },
      { codigoServicio: 'SRV-008', nombre: 'Lavado de inyectores',    precio: 55.00, cantidad: 1 }
    ]
  },
  {
    numero: 1006, fecha: '2026-10-25', placa: 'PKL-2345', mecanicoId: 2, estado: 'PENDIENTE',
    observaciones: 'Cambio de aceite programado',
    detalle: [
      { codigoServicio: 'SRV-001', nombre: 'Cambio de aceite y filtro', precio: 45.00, cantidad: 1 }
    ]
  }
];

module.exports = { clientes, mecanicos, servicios, vehiculos, ordenesTrabajo };
