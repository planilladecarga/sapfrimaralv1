// Modelo de datos: Contenedores
// { id: string, posicion: string, estado: string }

const STORAGE_KEY = 'wms_contenedores';

export const ESTADOS_CONTENEDOR = {
  LIBRE: 'LIBRE',
  OCUPADO: 'OCUPADO',
  RESERVADO: 'RESERVADO'
};

export function getContenedores() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveContenedores(contenedores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contenedores));
}

export function getContenedorById(id) {
  return getContenedores().find(c => c.id === id);
}

export function getContenedorByPosicion(posicion) {
  return getContenedores().find(c => c.posicion === posicion);
}

export function addContenedor(id, posicion) {
  const contenedores = getContenedores();
  let contenedor = getContenedorById(id) || getContenedorByPosicion(posicion);
  
  if (!contenedor) {
    contenedor = {
      id: id,
      posicion: posicion,
      estado: ESTADOS_CONTENEDOR.LIBRE
    };
    contenedores.push(contenedor);
    saveContenedores(contenedores);
  } else if (contenedor.id !== id) {
    // Si la posicion existe pero con otro ID, actualizamos el ID
    contenedor.id = id;
    saveContenedores(contenedores);
  }
  
  return contenedor;
}

export function updateContenedorEstado(id, estado) {
  const contenedores = getContenedores();
  const index = contenedores.findIndex(c => c.id === id);
  
  if (index !== -1) {
    contenedores[index].estado = estado;
    saveContenedores(contenedores);
    return contenedores[index];
  }
  return null;
}

export function resetContenedores() {
  localStorage.removeItem(STORAGE_KEY);
}

// Inicializar grilla de cámara A1-01 a A4-23
export function initContenedoresCamara() {
  const contenedores = getContenedores();
  if (contenedores.length > 0) return; // Ya inicializados
  
  const filas = ['A1', 'A2', 'A3', 'A4'];
  const maxPosiciones = 23;
  
  for (const fila of filas) {
    for (let i = 1; i <= maxPosiciones; i++) {
      const posicion = `${fila}-${i.toString().padStart(2, '0')}`;
      const id = `C20-${fila}${i}`; // ID generado por defecto si no viene del excel
      addContenedor(id, posicion);
    }
  }
}
