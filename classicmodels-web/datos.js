// =============================================================================
// datos.js  -  ACCESO A DATOS CONECTADO A FIREBASE CLOUD FIRESTORE
// =============================================================================
// NO HAY DATOS QUEMADOS EN ESTE ARCHIVO.
// La informacion se lee y se persiste exclusivamente desde la base de datos
// Cloud Firestore en Google Firebase (Proyecto: taller-mecanico-36841).
// Si la conexion se corta (USE_FIREBASE=false o falla de red), el sistema
// rechaza las peticiones con error HTTP 503 (comportamiento real de produccion).
// =============================================================================

const admin = require('firebase-admin');
const path = require('node:path');
const fs = require('node:fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let db = null;
const usarFirebase = process.env.USE_FIREBASE !== 'false';

if (usarFirebase && fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
} else if (!usarFirebase) {
  console.warn('⚠ ATENCION: Conexion con base de datos CORTADA por configuracion (USE_FIREBASE=false).');
}

// Colecciones en memoria pobladas exclusivamente desde Firestore
const clientes = [];
const mecanicos = [];
const servicios = [];
const vehiculos = [];
const ordenesTrabajo = [];

let cargados = false;
let cargandoPromise = null;

const IS_TEST = process.env.NODE_ENV === 'test';
let snapshotInicial = global.__TEST_SNAPSHOT__ || null;

async function cargarDesdeFirestore() {
  if (!db) {
    throw new Error('No hay conexion con la base de datos Firestore');
  }

  if (cargados) return;
  if (cargandoPromise) return cargandoPromise;

  cargandoPromise = (async () => {
    const snapCache = snapshotInicial || global.__TEST_SNAPSHOT__;
    if (IS_TEST && snapCache) {
      clientes.length = 0;
      clientes.push(...structuredClone(snapCache.clientes));
      mecanicos.length = 0;
      mecanicos.push(...structuredClone(snapCache.mecanicos));
      servicios.length = 0;
      servicios.push(...structuredClone(snapCache.servicios));
      vehiculos.length = 0;
      vehiculos.push(...structuredClone(snapCache.vehiculos));
      ordenesTrabajo.length = 0;
      ordenesTrabajo.push(...structuredClone(snapCache.ordenesTrabajo));
      cargados = true;
      return;
    }

    const [cSnap, mSnap, sSnap, vSnap, oSnap] = await Promise.all([
      db.collection('clientes').get(),
      db.collection('mecanicos').get(),
      db.collection('servicios').get(),
      db.collection('vehiculos').get(),
      db.collection('ordenesTrabajo').get()
    ]);

    clientes.length = 0;
    cSnap.forEach(d => clientes.push(d.data()));

    mecanicos.length = 0;
    mSnap.forEach(d => {
      const m = d.data();
      m.id = Number(m.id || d.id);
      mecanicos.push(m);
    });

    servicios.length = 0;
    sSnap.forEach(d => servicios.push(d.data()));

    vehiculos.length = 0;
    vSnap.forEach(d => vehiculos.push(d.data()));

    ordenesTrabajo.length = 0;
    oSnap.forEach(d => {
      const o = d.data();
      o.numero = Number(o.numero || d.id);
      ordenesTrabajo.push(o);
    });

    if (!snapshotInicial) {
      snapshotInicial = {
        clientes: structuredClone(clientes),
        mecanicos: structuredClone(mecanicos),
        servicios: structuredClone(servicios),
        vehiculos: structuredClone(vehiculos),
        ordenesTrabajo: structuredClone(ordenesTrabajo)
      };
      if (IS_TEST) {
        global.__TEST_SNAPSHOT__ = snapshotInicial;
      }
    }

    cargados = true;
  })().finally(() => {
    cargandoPromise = null;
  });

  return cargandoPromise;
}

// Persistencia en Cloud Firestore (activa en ejecucion normal / servidor web / Postman)
async function guardarDoc(coleccion, id, data) {
  if (!db || IS_TEST) return;
  try {
    await db.collection(coleccion).doc(String(id)).set(data, { merge: true });
  } catch (err) {
    console.error(`Error guardando en Firestore (${coleccion}/${id}):`, err.message);
  }
}

async function eliminarDoc(coleccion, id) {
  if (!db || IS_TEST) return;
  try {
    await db.collection(coleccion).doc(String(id)).delete();
  } catch (err) {
    console.error(`Error eliminando de Firestore (${coleccion}/${id}):`, err.message);
  }
}

module.exports = {
  clientes,
  mecanicos,
  servicios,
  vehiculos,
  ordenesTrabajo,
  db,
  get estaConectado() { return Boolean(db); },
  get cargados() { return cargados; },
  cargarDesdeFirestore,
  guardarDoc,
  eliminarDoc
};
