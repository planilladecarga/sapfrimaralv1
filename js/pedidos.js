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

export function obtenerSiguienteNumeroDespacho() {
  return listarPedidos().reduce((m, p) => Math.max(m, Number(p.numeroDespacho ?? p.id) || 0), 0) + 1;
}

export function crearPedido(cliente, palletIds = []) {
  const pallets = listarPallets();
  const ids = [...new Set(palletIds.map((v) => Number(v)))];
  const seleccionados = pallets.filter((p) => ids.includes(Number(p.id)));

  if (!seleccionados.length) throw new Error('Debe seleccionar pallets.');
  const invalidos = seleccionados.some((p) => p.estado !== ESTADOS_PALLET.EN_CAMARA || p.cliente !== cliente);
  if (invalidos || seleccionados.length !== ids.length) throw new Error('Hay pallets no disponibles para reserva.');

  const pedidos = listarPedidos();
  const nextId = pedidos.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
  const numeroDespacho = obtenerSiguienteNumeroDespacho();
  const pedido = {
    id: nextId,
    numeroDespacho,
    cliente,
    pallets: ids,
    estado: ESTADOS_PEDIDO.ABIERTO,
  };

  pedidos.push(pedido);
  guardarPedidos(pedidos);

  const actualizados = pallets.map((p) => (ids.includes(Number(p.id)) ? { ...p, estado: ESTADOS_PALLET.RESERVADO } : p));
  guardarPallets(actualizados);

  return pedido;
}

export function reservarPallet(palletId) {
  const pallets = listarPallets();
  const idx = pallets.findIndex((p) => Number(p.id) === Number(palletId));
  if (idx < 0) throw new Error('Pallet no existe.');
  if (pallets[idx].estado !== ESTADOS_PALLET.EN_CAMARA) throw new Error('Pallet no disponible.');
  pallets[idx].estado = ESTADOS_PALLET.RESERVADO;
  guardarPallets(pallets);
  return pallets[idx];
}
