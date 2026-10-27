# Classic Models - Sistema Web Empresarial

Proyecto de la asignatura Sistemas de Bases de Datos.

## Requisitos

- Oracle Database 21c XE con el esquema `GRUPO7` cargado
- Node.js 18 o superior

## Instalacion

```bash
npm install
```

## Configuracion

Editar el archivo `.env` con las credenciales de Oracle.

## Ejecucion

```bash
npm start
```

Abrir http://localhost:3000

## Estructura

```
classicmodels-web/
├── .env                    Credenciales (no se sube a GitHub)
├── server.js               Arranque del servidor
├── db.js                   Conexion con Oracle (pool)
├── middleware/
│   └── auth.js             Proteccion de rutas
├── controllers/            Logica de cada endpoint
│   ├── auth.controller.js
│   ├── clientes.controller.js
│   ├── productos.controller.js
│   └── reportes.controller.js
├── routes/                 Definicion de las URLs
│   ├── auth.routes.js
│   ├── clientes.routes.js
│   ├── productos.routes.js
│   └── reportes.routes.js
└── public/                 Frontend (Fase 12)
```

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET    | /api/ping | Comprobar que el servidor responde |
| POST   | /api/auth/login | Iniciar sesion |
| POST   | /api/auth/registro | Registrar usuario |
| POST   | /api/auth/logout | Cerrar sesion |
| GET    | /api/auth/sesion | Consultar la sesion actual |
| GET    | /api/clientes | Listar clientes |
| POST   | /api/clientes | Crear cliente |
| PUT    | /api/clientes/:codigo | Actualizar cliente |
| DELETE | /api/clientes/:codigo | Eliminar cliente |
| GET    | /api/productos | Listar productos |
| POST   | /api/productos | Crear producto |
| PUT    | /api/productos/:codigo | Actualizar producto |
| DELETE | /api/productos/:codigo | Eliminar producto |
| GET    | /api/reportes/ventas-cliente?codigo= | Ventas por cliente |
| GET    | /api/reportes/ventas-fechas?desde=&hasta= | Ventas por fechas |
| GET    | /api/reportes/vista/:nombre | Reportes basados en vistas |

## Usuarios de prueba

| Usuario | Contrasena | Rol |
|---------|-----------|-----|
| admin | admin123 | ADMIN |
| vendedor1 | venta123 | VENDEDOR |
