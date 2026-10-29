# PROYECTO GRUPO 5 - PRUEBAS DE SOFTWARE (NRC: 36841)

Sistema Web de Gestión de un **Taller Mecánico**, desarrollado con Node.js, Express y base de datos Cloud Firestore (Google Firebase), con soporte para modo local.

---

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

* **Node.js**: Versión 18 o superior ([Descargar Node.js](https://nodejs.org/)).
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
Dentro de la carpeta `classicmodels-web`, crea o edita tu archivo `.env`:

```env
PORT=4000
SESSION_SECRET=taller-mecanico-secret-key
USE_FIREBASE=true
```

> **Nota:** 
> - Con `USE_FIREBASE=true`: El servidor se conecta a Google Cloud Firestore.
> - Con `USE_FIREBASE=false`: El servidor opera en modo local/memoria desconectado.

### 4. Iniciar la aplicación

```bash
npm start
```

Abre tu navegador e ingresa a:
👉 **[http://localhost:4000](http://localhost:4000)**

---

## 🧪 Pruebas Automatizadas y Calidad de Código

### Pruebas Unitarias con Cobertura (Jest)
```bash
npm run test:coverage
```
*Cobertura superior al 72% en sentencias, ramas, funciones y líneas.*

### Auditoría Estática de Código (ESLint)
```bash
npm run lint
```
*0 errores y 0 advertencias.*

### Pruebas de Endpoints por Consola
Con el servidor corriendo en otra terminal:
```bash
node test-api.js
```

---

## 📬 Colección de Postman
El proyecto incluye la colección lista para importar con todas las peticiones organizadas:
📁 `Taller_Mecanico_Postman_Collection.json`

---

## 📁 Estructura del Proyecto

```text
PROYECTO_GRUPO5_PRUEBAS_36841/
├── README.md               # Documentación general del proyecto
├── sonar-project.properties# Configuración de SonarQube
├── Taller_Mecanico_Postman_Collection.json # Colección de Postman
└── classicmodels-web/      # Aplicación web principal (Backend + Frontend)
    ├── .env                # Configuración de entorno local
    ├── datos.js            # Capa de datos conectada a Firestore / modo local
    ├── server.js           # Servidor Express y configuración de rutas
    ├── controllers/        # Controladores con lógica de negocio y validaciones
    ├── routes/             # Definición de rutas API REST
    ├── test/               # Pruebas unitarias automatizadas con Jest
    └── public/             # Frontend web (HTML, CSS, JS)
```
