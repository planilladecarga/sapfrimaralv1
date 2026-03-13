import { listarContenedores } from './contenedores.js';

export function generarMapaCamara() {
  const contenedores = listarContenedores();
  const filas = { A1: [], A2: [], A3: [], A4: [] };

  contenedores.forEach((c) => {
    const [fila] = c.posicion.split('-');
    if (filas[fila]) filas[fila].push(c);
  });

  Object.values(filas).forEach((arr) => arr.sort((a, b) => a.posicion.localeCompare(b.posicion)));
  return filas;
}
