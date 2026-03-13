import { guardarDatos } from './storage.js';

export function loginAdmin(usuario, clave) {
  return String(usuario) === '1111' && String(clave) === '1111';
}

export function reiniciarSistema() {
  ['clientes', 'pallets', 'contenedores', 'pedidos', 'cargas'].forEach((k) => localStorage.removeItem(k));
  guardarDatos('clientes', []);
  guardarDatos('pallets', []);
  guardarDatos('contenedores', []);
  guardarDatos('pedidos', []);
  guardarDatos('cargas', []);
}
