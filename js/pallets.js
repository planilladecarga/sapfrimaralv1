import { guardarDatos, obtenerDatos } from './storage.js';
import { listarContenedores, guardarContenedores, ESTADOS_CONTENEDOR } from './contenedores.js';

const KEY = 'pallets';

export const ESTADOS_PALLET = {
  EN_CAMARA: 'EN_CAMARA',
  RESERVADO: 'RESERVADO',
  EN_CARGA: 'EN_CARGA',
  DESPACHADO: 'DESPACHADO',
};

export function listarPallets() {
  return obtenerDatos(KEY);
}

export function guardarPallets(lista) {
  guardarDatos(KEY, lista);
}

export function crearPallet(pallet) {
  const pallets = listarPallets();
  const id = Number(pallet.id);
  if (pallets.some((p) => Number(p.id) === id)) throw new Error(`Pallet ${id} ya existe.`);

  const nuevo = {
    id,
    cliente: String(pallet.cliente),
    producto: String(pallet.producto),
    lote: String(pallet.lote),
    contenedor: String(pallet.contenedor),
    kilos: Number(pallet.kilos) || 0,
    estado: pallet.estado || ESTADOS_PALLET.EN_CAMARA,
  };

  pallets.push(nuevo);
  guardarPallets(pallets);

  const contenedores = listarContenedores();
  const contenedorRef = String(nuevo.contenedor).trim().toUpperCase();
  const idx = contenedores.findIndex((c) => {
    const id = String(c.id).trim().toUpperCase();
    const posicion = String(c.posicion).trim().toUpperCase();
    const posicionDesdeId = id.startsWith('C20-') ? id.slice(4) : id;
    return id === contenedorRef || posicion === contenedorRef || posicionDesdeId === contenedorRef;
  });
  if (idx >= 0) {
    contenedores[idx].estado = ESTADOS_CONTENEDOR.OCUPADO;
    guardarContenedores(contenedores);
  }

  return nuevo;
}

export function filtrarPalletsPorCliente(cliente) {
  return listarPallets().filter((p) => p.cliente.toUpperCase().includes(String(cliente).toUpperCase()));
}

export function filtrarPallets({ cliente = '', producto = '', lote = '' } = {}) {
  return listarPallets().filter((p) =>
    p.cliente.toUpperCase().includes(String(cliente).toUpperCase())
    && p.producto.toUpperCase().includes(String(producto).toUpperCase())
    && p.lote.toUpperCase().includes(String(lote).toUpperCase()));
}
