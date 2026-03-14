import { guardarDatos, obtenerDatos } from './storage.js';

const KEY = 'clientes';

export function listarClientes() {
  return obtenerDatos(KEY);
}

// Soporta:
// - crearCliente('ANTIC S.A.')
// - crearCliente('ANTIC S.A.', 435)
// - crearCliente({ id: 435, nombre: 'ANTIC S.A.' })
export function crearCliente(inputNombre, inputId = null) {
  const clientes = listarClientes();

  const nombre = typeof inputNombre === 'object'
    ? String(inputNombre?.nombre || '').trim()
    : String(inputNombre || '').trim();

  const idPreferidoRaw = typeof inputNombre === 'object' ? inputNombre?.id : inputId;
  const idPreferido = Number(idPreferidoRaw);

  if (!nombre) throw new Error('Nombre de cliente requerido.');

  const existentePorId = Number.isFinite(idPreferido)
    ? clientes.find((c) => Number(c.id) === idPreferido)
    : null;
  if (existentePorId) return existentePorId;

  const existentePorNombre = clientes.find((c) => c.nombre.toUpperCase() === nombre.toUpperCase());
  if (existentePorNombre) return existentePorNombre;

  const nextId = clientes.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
  const nuevo = {
    id: Number.isFinite(idPreferido) ? idPreferido : nextId,
    nombre,
  };

  clientes.push(nuevo);
  guardarDatos(KEY, clientes);
  return nuevo;
}
