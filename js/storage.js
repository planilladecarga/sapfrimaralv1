export function guardarDatos(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

export function obtenerDatos(clave) {
  const raw = localStorage.getItem(clave);
  return raw ? JSON.parse(raw) : [];
}
