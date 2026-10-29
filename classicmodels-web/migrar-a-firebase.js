// =============================================================================
// migrar-a-firebase.js
// Sube todas las colecciones de datos.js a Cloud Firestore en Firebase
// =============================================================================

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const datos = require('./datos');

const PROJECT_ID = 'taller-mecanico-36841';

function getToken() {
  const p = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  if (!fs.existsSync(p)) throw new Error('No se encontro sesion activa de Firebase CLI');
  const conf = JSON.parse(fs.readFileSync(p, 'utf8'));
  return conf.tokens.access_token;
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val) } };
  }
  return { stringValue: String(val) };
}

async function guardarDocumento(token, coleccion, docId, obj) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${coleccion}/${docId}`;
  const cuerpo = { fields: toFirestoreFields(obj) };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cuerpo)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en ${coleccion}/${docId}: [${res.status}] ${errText}`);
  }
}

async function migrar() {
  console.log('Iniciando migracion a Cloud Firestore...');
  console.log(`Proyecto: ${PROJECT_ID}\n`);
  const token = getToken();

  // 1. Clientes
  process.stdout.write(`Subiendo ${datos.clientes.length} clientes... `);
  for (const c of datos.clientes) {
    await guardarDocumento(token, 'clientes', c.cedula, c);
  }
  console.log('OK');

  // 2. Vehiculos
  process.stdout.write(`Subiendo ${datos.vehiculos.length} vehiculos... `);
  for (const v of datos.vehiculos) {
    await guardarDocumento(token, 'vehiculos', v.placa, v);
  }
  console.log('OK');

  // 3. Servicios
  process.stdout.write(`Subiendo ${datos.servicios.length} servicios... `);
  for (const s of datos.servicios) {
    await guardarDocumento(token, 'servicios', s.codigo, s);
  }
  console.log('OK');

  // 4. Mecanicos
  process.stdout.write(`Subiendo ${datos.mecanicos.length} mecanicos... `);
  for (const m of datos.mecanicos) {
    await guardarDocumento(token, 'mecanicos', String(m.id), m);
  }
  console.log('OK');

  // 5. Ordenes de Trabajo
  process.stdout.write(`Subiendo ${datos.ordenesTrabajo.length} ordenes de trabajo... `);
  for (const o of datos.ordenesTrabajo) {
    await guardarDocumento(token, 'ordenesTrabajo', String(o.numero), o);
  }
  console.log('OK');

  console.log('\n============================================================');
  console.log('Migracion completada exitosamente a Cloud Firestore!');
  console.log(`Consola web: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/databases/-default-/data`);
  console.log('============================================================');
}

migrar().catch(err => {
  console.error('\nError en la migracion:', err.message);
  process.exit(1);
});
