// Modelo de datos: Cargas
// { id: string, pedido: string, estado: string }

import { getPedidoById, updatePedidoEstado, ESTADOS_PEDIDO } from './pedidos.js';
import { updatePalletEstado, ESTADOS_PALLET, getPalletById } from './stock.js';
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

export function addCarga(pedidoId) {
  const cargas = getCargas();
  const pedido = getPedidoById(pedidoId);

  if (!pedido) {
    throw new Error('El pedido seleccionado no existe.');
  }

  if (pedido.estado !== ESTADOS_PEDIDO.CREADO) {
    throw new Error('El pedido ya no está disponible para preparar una nueva carga.');
  }

  const cargaActiva = cargas.find(c => c.pedido === pedidoId && c.estado === ESTADOS_CARGA.PREPARANDO);
  if (cargaActiva) {
    throw new Error('Ya existe una carga en preparación para este pedido.');
  }

  const nextNumber = cargas.reduce((max, c) => {
    const n = parseInt(String(c.id).replace('CAR-', ''), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;
  
  const carga = {
    id: 'CAR-' + String(nextNumber).padStart(3, '0'),
    pedido: pedidoId,
    estado: ESTADOS_CARGA.PREPARANDO
  };
  
  cargas.push(carga);
  saveCargas(cargas);
  
  // Actualizar pedido a EN_PREPARACION
  updatePedidoEstado(pedidoId, ESTADOS_PEDIDO.EN_PREPARACION);
  
  // Actualizar pallets a EN_CARGA
  pedido.pallets.forEach(palletId => {
    updatePalletEstado(palletId, ESTADOS_PALLET.EN_CARGA);
  });
  
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
    updatePedidoEstado(carga.pedido, ESTADOS_PEDIDO.COMPLETADO);
    
    // Actualizar pallets a DESPACHADO y liberar contenedores
    const pedido = getPedidoById(carga.pedido);
    if (pedido) {
      pedido.pallets.forEach(palletId => {
        const pallet = updatePalletEstado(palletId, ESTADOS_PALLET.DESPACHADO);
        if (pallet && pallet.contenedor) {
          updateContenedorEstado(pallet.contenedor, ESTADOS_CONTENEDOR.LIBRE);
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
