import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function normalizarTexto(value = '') {
  return String(value || '').trim();
}

function esFilaTotales(c0 = '') {
  return /^totales?:/i.test(normalizarTexto(c0));
}

function obtenerClienteDesdeFila(row = []) {
  const c0 = normalizarTexto(row[0]);
  if (!/^cliente:/i.test(c0)) return null;

  // Formatos soportados:
  // - "Cliente: NOMBRE"
  // - "Cliente:" + columnas siguientes con código/nombre
  const inline = c0.replace(/^cliente:/i, '').trim();
  if (inline) return inline;

  const resto = [row[1], row[2], row[3]].map(normalizarTexto).filter(Boolean);
  if (!resto.length) return null;

  // Si viene "9.175 CRUFI S.A.", extraer solo texto luego del código si aplica
  const joined = resto.join(' ');
  const m = joined.match(/^(\d+[\d.,-]*)\s+(.*)$/);
  return (m?.[2] || joined).trim();
}

function esFormatoStockPrincipal(row = []) {
  const c2 = normalizarTexto(row[2]).toLowerCase();
  const c3 = normalizarTexto(row[3]).toLowerCase();
  return c2 === 'contenedor' && c3 === 'pallets';
}

export function importarExcelStock(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        generarContenedoresBase();
        const wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        let clienteActual = null;
        let nuevos = 0;
        let creadosPorCantidad = 0;

        const palletsActuales = listarPallets();
        const idsExistentes = new Set(palletsActuales.map((pal) => Number(pal.id)).filter((id) => Number.isFinite(id)));
        let nextId = palletsActuales.reduce((m, pal) => Math.max(m, Number(pal.id) || 0), 0) + 1;

        rows.forEach((r) => {
          const c0 = normalizarTexto(r[0]);
          if (!c0 && !normalizarTexto(r[2])) return;

          const clienteEnFila = obtenerClienteDesdeFila(r);
          if (clienteEnFila) {
            clienteActual = crearCliente(clienteEnFila).nombre;
            return;
          }

          if (esFormatoStockPrincipal(r)) return;
          if (esFilaTotales(c0) || /^fecha:?|^reporte:/i.test(c0)) return;

          if (!clienteActual) return;

          // Formato principal de stock: C=Contenedor, D=Pallets(cantidad), F=Kilos, G=Contenido
          const contenedorStock = normalizarTexto(r[2]);
          const cantidadStock = Math.max(0, Math.floor(toNumber(r[3], 0)));
          const kilosStock = toNumber(r[5], 0);
          const contenidoStock = normalizarTexto(r[6]);

          // Formato alternativo previo: [id, producto, lote, contenedor, cantidad/kilos, kilos]
          const contenedorAlt = normalizarTexto(r[3]);
          const cantidadAlt = Math.max(0, Math.floor(toNumber(r[4], 0)));
          const contenidoAlt = normalizarTexto(r[1]);

          const usarFormatoStock = Boolean(contenedorStock && cantidadStock > 0);
          const contenedor = usarFormatoStock ? contenedorStock : contenedorAlt;
          const cantidad = usarFormatoStock ? cantidadStock : Math.max(1, cantidadAlt || 1);
          const kilosTotales = usarFormatoStock ? kilosStock : toNumber(r[5], toNumber(r[4], 0));
          const contenido = usarFormatoStock ? contenidoStock : contenidoAlt;
          const lote = normalizarTexto(r[1]) || normalizarTexto(r[0]);

          if (!contenedor || !contenido || cantidad <= 0) return;

          crearContenedor(contenedor, contenedor);

          const kilosPorPallet = cantidad > 0 ? (kilosTotales / cantidad) || 0 : 0;

          for (let i = 0; i < cantidad; i += 1) {
            while (idsExistentes.has(nextId)) nextId += 1;

            crearPallet({
              id: nextId,
              cliente: clienteActual,
              producto: contenido,
              lote,
              contenedor,
              kilos: Number(kilosPorPallet.toFixed(2)),
            });

            idsExistentes.add(nextId);
            nextId += 1;
            nuevos += 1;
            if (cantidad > 1) creadosPorCantidad += 1;
          }
        });

        resolve({ ok: true, nuevos, creadosPorCantidad });
      } catch (e) {
        reject(e);
      }
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}
