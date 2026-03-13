import { guardarDatos, obtenerDatos } from './storage.js';

const KEY = 'contenedores';

export const ESTADOS_CONTENEDOR = {
  LIBRE: 'LIBRE',
  OCUPADO: 'OCUPADO',
  RESERVADO: 'RESERVADO',
};

export function listarContenedores() {
  return obtenerDatos(KEY);
}

export function guardarContenedores(lista) {
  guardarDatos(KEY, lista);
}

export function crearContenedor(id, posicion, estado = ESTADOS_CONTENEDOR.LIBRE) {
  const contenedores = listarContenedores();
  const existente = contenedores.find((c) => c.id === id || c.posicion === posicion);
  if (existente) return existente;
  const nuevo = { id: String(id), posicion: String(posicion), estado };
  contenedores.push(nuevo);
  guardarContenedores(contenedores);
  return nuevo;
}

export function generarContenedoresBase() {
  const existentes = listarContenedores();
  if (existentes.length) return existentes;

  const filas = ['A1', 'A2', 'A3', 'A4'];
  const lista = [];
  filas.forEach((f) => {
    for (let i = 1; i <= 23; i += 1) {
      const num = String(i).padStart(2, '0');
      lista.push({ id: `C20-${f}-${num}`, posicion: `${f}-${num}`, estado: ESTADOS_CONTENEDOR.LIBRE });
    }
  });
  guardarContenedores(lista);
  return lista;
}
