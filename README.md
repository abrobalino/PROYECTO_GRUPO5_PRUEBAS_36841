# PROYECTO GRUPO 5 - PRUEBAS DE SOFTWARE (NRC: 36841)

Sistema Web Empresarial basado en el modelo **ClassicModels**, desarrollado con Node.js, Express y Oracle Database (PL/SQL).

---

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* **Node.js**: Versión 18 o superior ([Descargar Node.js](https://nodejs.org/)).
* **Oracle Database**: Oracle Database 19c / 21c XE con el servicio `XEPDB1` activo y el esquema/usuario `GRUPO7` cargado.
* **Git**: Para clonar y gestionar versiones.

---

## 🚀 Guía de Instalación y Ejecución

### 1. Clonar el repositorio
Abre una terminal y clona el proyecto en tu máquina:

```bash
git clone https://github.com/abrobalino/PROYECTO_GRUPO5_PRUEBAS_36841.git
cd PROYECTO_GRUPO5_PRUEBAS_36841
```

### 2. Instalar dependencias
Entra a la carpeta de la aplicación web e instala las dependencias de Node:

```bash
cd classicmodels-web
npm install
```

### 3. Configurar variables de entorno (`.env`)
Dentro de la carpeta `classicmodels-web`, crea un archivo llamado `.env` copiando la plantilla de ejemplo:

```bash
cp .env.example .env
```

Verifica o ajusta los valores dentro de `.env` según tu entorno local:

```env
DB_USER=GRUPO7
DB_PASSWORD=grupo7
DB_CONNECT=localhost:1521/XEPDB1
PORT=3000
SESSION_SECRET=classicmodels-secret-key
```

### 4. Verificar la conexión a la Base de Datos
Puedes probar si tu conexión con Oracle es exitosa ejecutando:

```bash
node test-conexion.js
```

Si todo está correcto, verás el mensaje: `CONEXION OK -> [ [ 'GRUPO7', 'XEPDB1' ] ]`.

### 5. Iniciar la aplicación

```bash
npm start
```

Abre tu navegador e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Pruebas Rápidas de la API

Con el servidor corriendo, puedes abrir otra terminal en la carpeta `classicmodels-web/` y ejecutar la suite de pruebas del backend:

```bash
node test-api.js
```

---

## 👥 Credenciales de Acceso (Usuarios de Prueba)

| Usuario | Contraseña | Rol | Acceso |
| :--- | :--- | :--- | :--- |
| **admin** | `admin123` | ADMIN | Gestión total (clientes, productos, reportes, auditoría) |
| **vendedor1** | `venta123` | VENDEDOR | Gestión de clientes y consultas |

---

## 📁 Estructura del Proyecto

```text
PROYECTO_GRUPO5_PRUEBAS_36841/
├── README.md               # Documentación general del proyecto
├── .gitignore              # Archivos y carpetas ignorados por git
└── classicmodels-web/      # Aplicación web principal (Backend + Frontend)
    ├── .env.example        # Plantilla de configuración de entorno
    ├── db.js               # Conexión y pool de conexiones Oracle
    ├── server.js           # Servidor Express y configuración de rutas
    ├── test-conexion.js    # Script de prueba de conexión a BD
    ├── test-api.js         # Script de pruebas de endpoints
    ├── controllers/        # Controladores que invocan procedimientos PL/SQL
    ├── routes/             # Definición de rutas API
    ├── middleware/         # Middleware de control de sesión y autenticación
    └── public/             # Frontend estático (HTML, CSS, JS)
```
