import { guardarDatos, obtenerDatos } from './storage.js';
import { listarPedidos } from './pedidos.js';
import { listarPallets, guardarPallets, ESTADOS_PALLET } from './pallets.js';

const KEY = 'cargas';

export function listarCargas() {
  return obtenerDatos(KEY);
}

export function crearCarga(cliente) {
  const clienteNormalizado = String(cliente || '').trim().toUpperCase();
  if (!clienteNormalizado) throw new Error('Debe seleccionar un cliente para crear la carga.');

  const pedidos = listarPedidos().filter((p) =>
    String(p.cliente || '').trim().toUpperCase() === clienteNormalizado && p.estado === 'ABIERTO');

  if (!pedidos.length) throw new Error('No hay pedido ABIERTO para el cliente.');

  const pedido = pedidos[0];
  const pallets = listarPallets();
  const ids = pedido.pallets.map(Number);

  const actualizados = pallets.map((p) => (ids.includes(Number(p.id)) ? { ...p, estado: ESTADOS_PALLET.EN_CARGA } : p));
  guardarPallets(actualizados);

  const cargas = listarCargas();
  const nextId = cargas.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
  const carga = { id: nextId, cliente, pallets: ids, fecha: new Date().toISOString().slice(0, 10) };
  cargas.push(carga);
  guardarDatos(KEY, cargas);
  return carga;
}

export function moverPalletACarga(palletId) {
  const pallets = listarPallets();
  const idx = pallets.findIndex((p) => Number(p.id) === Number(palletId));
  if (idx < 0) throw new Error('Pallet no existe.');
  if (pallets[idx].estado !== ESTADOS_PALLET.RESERVADO) throw new Error('Pallet debe estar RESERVADO.');
  pallets[idx].estado = ESTADOS_PALLET.EN_CARGA;
  guardarPallets(pallets);
  return pallets[idx];
}

export function generarPlanillaCarga(lista = []) {
  const totalKilos = lista.reduce((acc, p) => acc + (Number(p.kilos) || 0), 0);
  return { cantidadPallets: lista.length, totalKilos };
}

export function cargaSanJacinto() {
  const pallets = listarPallets();
  const seleccion = [];

  pallets.forEach((p) => {
    if (String(p.cliente).toUpperCase().includes('SAN JACINTO') && p.estado === ESTADOS_PALLET.EN_CAMARA) {
      p.estado = ESTADOS_PALLET.EN_CARGA;
      seleccion.push(p);
    }
  });

  guardarPallets(pallets);
  return seleccion;
}
