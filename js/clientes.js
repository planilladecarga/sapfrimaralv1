// Modelo de datos: Clientes
// { id: number, nombre: string }

const STORAGE_KEY = 'wms_clientes';

export function getClientes() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveClientes(clientes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

export function getClienteById(id) {
  return getClientes().find(c => c.id === parseInt(id));
}

export function getClienteByNombre(nombre) {
  return getClientes().find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
}

export function addCliente(id, nombre) {
  const clientes = getClientes();
  let cliente = getClienteById(id);
  
  if (!cliente) {
    cliente = {
      id: parseInt(id),
      nombre: nombre.trim()
    };
    clientes.push(cliente);
    saveClientes(clientes);
  }
  
  return cliente;
}

export function resetClientes() {
  localStorage.removeItem(STORAGE_KEY);
}
