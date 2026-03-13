// Modelo de datos: Pedidos
// { id: string, clienteId: string, pallets: string[], estado: string }

import { getPalletById, updatePalletEstado, ESTADOS_PALLET } from './stock.js';

const STORAGE_KEY = 'wms_pedidos';

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'PENDIENTE',
  EN_PREPARACION: 'EN_PREPARACION',
  COMPLETADO: 'COMPLETADO'
};

export function getPedidos() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePedidos(pedidos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
}

export function addPedido(clienteId, palletIds) {
  const pedidos = getPedidos();
  
  const pedido = {
    id: 'PED-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    clienteId,
    pallets: palletIds,
    estado: ESTADOS_PEDIDO.PENDIENTE
  };
  
  pedidos.push(pedido);
  savePedidos(pedidos);
  
  // Cambiar estado de pallets a RESERVADO
  palletIds.forEach(id => {
    updatePalletEstado(id, ESTADOS_PALLET.RESERVADO);
  });
  
  return pedido;
}

export function getPedidoById(id) {
  return getPedidos().find(p => p.id === id);
}

export function updatePedidoEstado(id, estado) {
  const pedidos = getPedidos();
  const index = pedidos.findIndex(p => p.id === id);
  
  if (index !== -1) {
    pedidos[index].estado = estado;
    savePedidos(pedidos);
    return pedidos[index];
  }
  return null;
}

export function resetPedidos() {
  localStorage.removeItem(STORAGE_KEY);
}
