import { guardarDatos, obtenerDatos } from './storage.js';
import { listarPallets, guardarPallets, ESTADOS_PALLET } from './pallets.js';

const KEY = 'pedidos';

export function listarPedidos() {
  return obtenerDatos(KEY);
}

export function crearPedido(cliente, palletsSeleccionados = [], despachoNumero = '') {
  const clienteNormalizado = String(cliente || '').trim();
  if (!clienteNormalizado) throw new Error('Debe seleccionar un cliente.');

  const despacho = String(despachoNumero || '').trim();
  if (!despacho) throw new Error('Debe indicar el N° de despacho.');

  const pedidos = listarPedidos();
  const yaExisteDespacho = pedidos.some((p) => String(p.id) === despacho);
  if (yaExisteDespacho) throw new Error(`El despacho ${despacho} ya existe.`);

  const pallets = listarPallets();
  const ids = [...new Set(palletsSeleccionados.map((v) => String(v.id || '').trim()).filter(Boolean))];
  const seleccionados = pallets.filter((p) => ids.includes(String(p.id)));

  if (!seleccionados.length) throw new Error('Debe seleccionar pallets.');

  const invalidos = seleccionados.some((p) =>
    p.estado !== ESTADOS_PALLET.EN_CAMARA
    || String(p.cliente).trim().toUpperCase() !== clienteNormalizado.toUpperCase());
  if (invalidos || seleccionados.length !== ids.length) throw new Error('Hay pallets no disponibles para reserva.');

  const detalle = palletsSeleccionados
    .filter((x) => ids.includes(String(x.id)))
    .map((x) => {
      const cajas = Number(x.cajas);
      const pallet = seleccionados.find((p) => String(p.id) === String(x.id));
      const cajasDisponibles = Number(pallet?.cajas);
      if (Number.isFinite(cajas) && cajas > 0 && Number.isFinite(cajasDisponibles) && cajas > cajasDisponibles) {
        throw new Error(`Cajas solicitadas superan disponibles para pallet ${x.id}.`);
      }
      return { id: String(x.id), cajas: Number.isFinite(cajas) && cajas > 0 ? cajas : null };
    });

  const pedido = { id: despacho, cliente: clienteNormalizado, pallets: ids, detalle, estado: 'ABIERTO' };

  pedidos.push(pedido);
  guardarDatos(KEY, pedidos);

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
