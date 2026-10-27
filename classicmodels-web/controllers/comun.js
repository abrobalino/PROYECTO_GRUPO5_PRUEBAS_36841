// =============================================================================
// controllers/comun.js  -  UTILIDADES COMPARTIDAS
// =============================================================================

// Pasa a minusculas y quita tildes, para que buscar "lopez" encuentre "López"
const normalizar = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// true si alguno de los textos contiene la busqueda (o si no hay busqueda)
const coincide = (busqueda, ...textos) =>
  !busqueda || textos.some(t => normalizar(t).includes(normalizar(busqueda)));

module.exports = { normalizar, coincide };
