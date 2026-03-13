import { guardarDatos, obtenerDatos } from './storage.js';

const KEY = 'clientes';

export function listarClientes() {
  return obtenerDatos(KEY);
}

export function crearCliente(nombre) {
  const limpio = String(nombre || '').trim();
  if (!limpio) throw new Error('Nombre de cliente requerido.');

  const clientes = listarClientes();
  const existente = clientes.find((c) => c.nombre.toUpperCase() === limpio.toUpperCase());
  if (existente) return existente;

  const nextId = clientes.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
  const nuevo = { id: nextId, nombre: limpio };
  clientes.push(nuevo);
  guardarDatos(KEY, clientes);
  return nuevo;
}
