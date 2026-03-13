// Modelo de datos: Pallets (Stock)
// { id: string, cliente: number, producto: string, lote: string, contenedor: string, kilos: number, estado: string }

import { getClienteById } from './clientes.js';
import { getContenedorById, updateContenedorEstado, ESTADOS_CONTENEDOR } from './contenedores.js';

const STORAGE_KEY = 'wms_pallets';

export const ESTADOS_PALLET = {
  EN_CAMARA: 'EN_CAMARA',
  RESERVADO: 'RESERVADO',
  EN_CARGA: 'EN_CARGA',
  DESPACHADO: 'DESPACHADO'
};

export function getPallets() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePallets(pallets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pallets));
}

export function addPallet(id, clienteId, producto, lote, contenedorId, kilos) {
  const pallets = getPallets();
  
  const pallet = {
    id: id,
    cliente: parseInt(clienteId),
    producto: producto,
    lote: lote,
    contenedor: contenedorId,
    kilos: parseFloat(kilos),
    estado: ESTADOS_PALLET.EN_CAMARA
  };
  
  pallets.push(pallet);
  savePallets(pallets);
  
  // Actualizar estado del contenedor a OCUPADO
  if (contenedorId) {
    updateContenedorEstado(contenedorId, ESTADOS_CONTENEDOR.OCUPADO);
  }
  
  return pallet;
}

export function getPalletsByCliente(clienteId) {
  return getPallets().filter(p => p.cliente === parseInt(clienteId));
}

export function getPalletsByContenedor(contenedorId) {
  return getPallets().filter(p => p.contenedor === contenedorId);
}

export function getPalletById(id) {
  return getPallets().find(p => p.id === id);
}

export function updatePalletEstado(id, estado) {
  const pallets = getPallets();
  const index = pallets.findIndex(p => p.id === id);
  
  if (index !== -1) {
    pallets[index].estado = estado;
    savePallets(pallets);
    return pallets[index];
  }
  return null;
}

export function resetStock() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStockEnCamara() {
  return getPallets().filter(p => p.estado === ESTADOS_PALLET.EN_CAMARA);
}
