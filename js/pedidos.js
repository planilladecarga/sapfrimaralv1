// Modelo de datos: Pedidos
// { id: string, cliente: number, pallets: string[], estado: string }

import { getPalletById, updatePalletEstado, ESTADOS_PALLET } from './stock.js';

const STORAGE_KEY = 'wms_pedidos';

export const ESTADOS_PEDIDO = {
  CREADO: 'CREADO',
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
  const clienteIdNum = parseInt(clienteId);
  const uniquePalletIds = [...new Set(palletIds)];

  const palletsValidos = uniquePalletIds.map(id => getPalletById(id));
  const palletsInvalidos = palletsValidos.some(p => !p || p.cliente !== clienteIdNum || p.estado !== ESTADOS_PALLET.EN_CAMARA);
  if (palletsInvalidos) {
    throw new Error('Uno o más pallets seleccionados ya no están disponibles para crear el pedido.');
  }

  const nextNumber = pedidos.reduce((max, p) => {
    const n = parseInt(String(p.id).replace('PED-', ''), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;
  
  const pedido = {
    id: 'PED-' + String(nextNumber).padStart(3, '0'),
    cliente: clienteIdNum,
    pallets: uniquePalletIds,
    estado: ESTADOS_PEDIDO.CREADO
  };
  
  pedidos.push(pedido);
  savePedidos(pedidos);
  
  // Cambiar estado de pallets a RESERVADO
  uniquePalletIds.forEach(id => {
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
