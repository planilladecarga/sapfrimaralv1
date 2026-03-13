// Modelo de datos: Cargas
// { id: string, pedidoId: string, contenedores: string[], estado: string }

import { getPedidoById, updatePedidoEstado, ESTADOS_PEDIDO } from './pedidos.js';
import { updatePalletEstado, ESTADOS_PALLET } from './stock.js';
import { updateContenedorEstado, ESTADOS_CONTENEDOR } from './contenedores.js';

const STORAGE_KEY = 'wms_cargas';

export const ESTADOS_CARGA = {
  PREPARANDO: 'PREPARANDO',
  FINALIZADA: 'FINALIZADA'
};

export function getCargas() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveCargas(cargas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cargas));
}

export function addCarga(pedidoId, contenedoresIds) {
  const cargas = getCargas();
  
  const carga = {
    id: 'CARGA-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    pedidoId,
    contenedores: contenedoresIds,
    estado: ESTADOS_CARGA.PREPARANDO
  };
  
  cargas.push(carga);
  saveCargas(cargas);
  
  // Actualizar pedido a EN_PREPARACION
  updatePedidoEstado(pedidoId, ESTADOS_PEDIDO.EN_PREPARACION);
  
  // Actualizar pallets a EN_CARGA
  const pedido = getPedidoById(pedidoId);
  if (pedido) {
    pedido.pallets.forEach(palletId => {
      updatePalletEstado(palletId, ESTADOS_PALLET.EN_CARGA);
    });
  }
  
  return carga;
}

export function finalizarCarga(cargaId) {
  const cargas = getCargas();
  const index = cargas.findIndex(c => c.id === cargaId);
  
  if (index !== -1) {
    cargas[index].estado = ESTADOS_CARGA.FINALIZADA;
    saveCargas(cargas);
    
    const carga = cargas[index];
    
    // Actualizar pedido a COMPLETADO
    updatePedidoEstado(carga.pedidoId, ESTADOS_PEDIDO.COMPLETADO);
    
    // Actualizar pallets a DESPACHADO y liberar contenedores
    const pedido = getPedidoById(carga.pedidoId);
    if (pedido) {
      pedido.pallets.forEach(palletId => {
        const pallet = updatePalletEstado(palletId, ESTADOS_PALLET.DESPACHADO);
        if (pallet && pallet.contenedorId) {
          updateContenedorEstado(pallet.contenedorId, ESTADOS_CONTENEDOR.LIBRE);
        }
      });
    }
    
    return carga;
  }
  return null;
}

export function getCargaById(id) {
  return getCargas().find(c => c.id === id);
}

export function resetCargas() {
  localStorage.removeItem(STORAGE_KEY);
}
