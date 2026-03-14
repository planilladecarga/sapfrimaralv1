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
  const rawId = pallet.id;
  const idNormalizado = String(rawId || '').trim();

  if (!idNormalizado) throw new Error('ID pallet requerido.');

  const existe = pallets.some((p) => String(p.id) === idNormalizado);
  if (existe) throw new Error(`Pallet ${idNormalizado} ya existe.`);

  const clienteIdNum = Number(pallet.clienteId);
  const clienteNombre = String(
    pallet.clienteNombre || pallet.cliente || '',
  ).trim();

  const nuevo = {
    id: idNormalizado,
    cliente: clienteNombre,
    clienteId: Number.isFinite(clienteIdNum) ? clienteIdNum : null,
    clienteNombre,
    producto: String(pallet.producto || '').trim(),
    lote: String(pallet.lote || '').trim(),
    contenedor: String(pallet.contenedor || '').trim(),
    kilos: Number(pallet.kilos) || 0,
    cajas: Number(pallet.cajas) || 0,
    fechaVencimiento: String(pallet.fechaVencimiento || '').trim(),
    estado: pallet.estado || ESTADOS_PALLET.EN_CAMARA,
  };

  pallets.push(nuevo);
  guardarPallets(pallets);

  const contenedores = listarContenedores();
  const idx = contenedores.findIndex((c) => c.id === nuevo.contenedor);
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
