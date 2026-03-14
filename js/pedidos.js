import { guardarDatos, obtenerDatos } from './storage.js';
import { listarPallets, guardarPallets, ESTADOS_PALLET } from './pallets.js';

const KEY = 'pedidos';

export const ESTADOS_PEDIDO = {
  ABIERTO: 'ABIERTO',
  CARGADO: 'CARGADO',
};

export function listarPedidos() {
  return obtenerDatos(KEY);
}

export function guardarPedidos(lista) {
  guardarDatos(KEY, lista);
}

export function crearPedido(cliente, palletIds = []) {
  const pallets = listarPallets();
  const ids = [...new Set(palletsSeleccionados.map((v) => String(v.id || '').trim()).filter(Boolean))];
  const seleccionados = pallets.filter((p) => ids.includes(String(p.id)));

  if (!seleccionados.length) throw new Error('Debe seleccionar pallets.');

  const invalidos = seleccionados.some((p) =>
    p.estado !== ESTADOS_PALLET.EN_CAMARA
    || String(p.cliente).trim().toUpperCase() !== clienteNormalizado.toUpperCase());
  if (invalidos || seleccionados.length !== ids.length) throw new Error('Hay pallets no disponibles para reserva.');

  const pedidos = listarPedidos();
  const nextId = pedidos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  const pedido = {
    id: nextId,
    numeroDespacho: nextId,
    cliente,
    pallets: ids,
    estado: ESTADOS_PEDIDO.ABIERTO,
  };

  pedidos.push(pedido);
  guardarPedidos(pedidos);

  const actualizados = pallets.map((p) => (ids.includes(String(p.id)) ? { ...p, estado: ESTADOS_PALLET.RESERVADO } : p));
  guardarPallets(actualizados);

  return pedido;
}

export function reservarPallet(palletId) {
  const pallets = listarPallets();
  const idx = pallets.findIndex((p) => String(p.id) === String(palletId));
  if (idx < 0) throw new Error('Pallet no existe.');
  if (pallets[idx].estado !== ESTADOS_PALLET.EN_CAMARA) throw new Error('Pallet no disponible.');
  pallets[idx].estado = ESTADOS_PALLET.RESERVADO;
  guardarPallets(pallets);
  return pallets[idx];
}
