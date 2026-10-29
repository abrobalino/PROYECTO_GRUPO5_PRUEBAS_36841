# Taller Mecanico - Sistema Web

Proyecto de la asignatura Sistemas de Bases de Datos.

Gestion de clientes, vehiculos, servicios, mecanicos y ordenes de trabajo de
un taller mecanico. Adaptado del proyecto Classic Models.

## Requisitos

- Node.js 18 o superior
- **Base de Datos**: Google Cloud Firestore (Firebase).
  - Configurado en `serviceAccountKey.json`.
  - Si la base de datos se desconecta (`USE_FIREBASE=false`), las APIs rechazan peticiones con código **503 Service Unavailable** (comportamiento real de producción).
- **No tiene inicio de sesion**: la aplicacion abre directamente en el panel.

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm start
```

Abrir http://localhost:4000

## De Classic Models al taller

| Classic Models | Taller mecanico | Cambio |
|----------------|-----------------|--------|
| customers | clientes | Campos: cedula, nombres, telefono, email, direccion |
| employees | mecanicos | Agrega especialidad, activo, usuario, password y rol |
| usuarios | (dentro de mecanicos) | Se elimina: sus campos pasan a mecanicos |
| products | servicios | Servicios con precio y duracion, sin stock |
| orders + orderdetails | ordenesTrabajo | Se fusionan: el detalle va dentro de la orden como arreglo |
| (no existia) | vehiculos | Placa, marca, modelo, anio y cliente dueno |
| productlines, payments, offices, auditoria | - | Se eliminan |

## Las 5 colecciones (`datos.js`)

| Coleccion | Clave | Campos |
|-----------|-------|--------|
| clientes | cedula | cedula, nombres, telefono, email, direccion |
| mecanicos | id | id, nombres, especialidad, activo, usuario, password, rol |
| servicios | codigo | codigo, nombre, descripcion, precio, duracion (min) |
| vehiculos | placa | placa, marca, modelo, anio, cedulaCliente |
| ordenesTrabajo | numero | numero, fecha, placa, mecanicoId, estado, observaciones, detalle[] |

Cada elemento de `detalle` es `{ codigoServicio, nombre, precio, cantidad }`.
El nombre y el precio se copian al crear la orden, asi un cambio de precio en
el catalogo no altera las ordenes anteriores.

## Reglas de negocio

- Cedula de 10 digitos, unica. Email y telefono validos.
- Placa con formato `ABC-1234`, unica. El dueno debe existir.
- No se elimina un cliente con vehiculos, un vehiculo con ordenes ni un
  servicio usado en ordenes.
- Un mecanico con ordenes no se borra: se marca como inactivo.
  Los mecanicos inactivos no pueden recibir ordenes nuevas.
- El estado de la orden solo avanza: PENDIENTE -> EN PROCESO -> TERMINADA -> ENTREGADA.
  Una orden ENTREGADA no se modifica. Solo se eliminan ordenes PENDIENTES.

## Estructura

```
classicmodels-web/
├── .env                    Configuración del entorno y Firebase
├── server.js               Arranque del servidor y control 503
├── datos.js                Acceso a datos conectado a Cloud Firestore
├── controllers/            Logica de cada endpoint
│   ├── clientes.controller.js
│   ├── vehiculos.controller.js
│   ├── servicios.controller.js
│   ├── mecanicos.controller.js
│   ├── ordenes.controller.js
│   └── consultas.controller.js
├── routes/                 Definicion de las URLs
└── public/                 Frontend
```

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET    | /api/ping | Comprobar que el servidor responde |
| GET/POST | /api/clientes | Listar / crear clientes |
| PUT/DELETE | /api/clientes/:cedula | Actualizar / eliminar cliente |
| GET/POST | /api/vehiculos | Listar / crear vehiculos |
| PUT/DELETE | /api/vehiculos/:placa | Actualizar / eliminar vehiculo |
| GET/POST | /api/servicios | Listar / crear servicios |
| PUT/DELETE | /api/servicios/:codigo | Actualizar / eliminar servicio |
| GET    | /api/mecanicos | Listar mecanicos |
| POST/PUT/DELETE | /api/mecanicos[/:id] | Crear / actualizar / eliminar mecanico |
| GET/POST | /api/ordenes | Listar / crear ordenes de trabajo |
| GET/PUT/DELETE | /api/ordenes/:numero | Ver / actualizar / eliminar orden |
| GET    | /api/consultas/ordenes-cliente?cedula= | Ordenes de un cliente |
| GET    | /api/consultas/ordenes-fechas?desde=&hasta= | Ordenes entre fechas |
