import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
          const c0 = String(r[0] || '').trim();
          if (!c0) return;

          if (/^cliente:/i.test(c0)) {
            const texto = c0.replace(/^cliente:/i, '').trim();
            const partes = texto.match(/^(\d+)?\s*(.*)$/);
            clienteActual = crearCliente((partes?.[2] || texto).trim()).nombre;
            return;
          }

          if (!clienteActual || /^id|pallet$/i.test(c0)) return;

          const idRaw = r[0];
          const producto = String(r[1] || '').trim();
          const lote = String(r[2] || '').trim();
          const contenedor = String(r[3] || '').trim();
          const cantidad = Math.max(1, Math.floor(toNumber(r[4], 1)));
          const kilos = toNumber(r[5], toNumber(r[4], 0));

          if (!producto || !contenedor) return;

          crearContenedor(contenedor, contenedor);

          for (let i = 0; i < cantidad; i += 1) {
            const idCandidato = i === 0 && toNumber(idRaw, 0) > 0 ? toNumber(idRaw) : nextId;
            const existe = idsExistentes.has(Number(idCandidato));
            if (existe) {
              nextId += 1;
              continue;
            }

            crearPallet({
              id: idCandidato,
              cliente: clienteActual,
              producto,
              lote,
              contenedor,
              kilos,
            });
            nuevos += 1;
            if (cantidad > 1) creadosPorCantidad += 1;
            idsExistentes.add(Number(idCandidato));
            nextId = Math.max(nextId, Number(idCandidato) + 1);
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
