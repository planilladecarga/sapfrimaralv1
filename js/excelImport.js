import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets, ESTADOS_PALLET } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

const ETIQUETAS_IGNORAR = ['fecha:', 'fecha hasta:', 'reporte:', 'totales:'];

function textoCelda(cell) {
  return String(cell || '').trim();
}

function esFilaIgnorable(c0) {
  const t = c0.toLowerCase();
  return ETIQUETAS_IGNORAR.some((x) => t.startsWith(x));
}

function parsearClienteDesdeFila(row) {
  const c0 = textoCelda(row[0]);
  if (!/^cliente\s*:?/i.test(c0)) return null;

  const idDesdeCol1 = Number(textoCelda(row[1]));
  const nombreDesdeCol2 = textoCelda(row[2]);

  if (Number.isFinite(idDesdeCol1) && nombreDesdeCol2) {
    return { id: idDesdeCol1, nombre: nombreDesdeCol2 };
  }

  // Fallback: si viene todo junto en columna 0
  const combinado = [c0, ...row.slice(1).map(textoCelda).filter(Boolean)].join(' ').trim();
  const sinPrefijo = combinado.replace(/^cliente\s*:?\s*/i, '');
  const m = sinPrefijo.match(/^(\d+)\s+(.+)$/);
  if (!m) return null;
  return { id: Number(m[1]), nombre: m[2].trim() };
}

function convertirAFecha(valor) {
  const t = textoCelda(valor);
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t);
}

function generarSiguienteIdPallet() {
  const pallets = listarPallets();
  const max = pallets.reduce((acc, p) => {
    const m = String(p.id).match(/^PALLET-(\d+)$/i);
    if (!m) return acc;
    return Math.max(acc, Number(m[1]));
  }, 0);
  return `PALLET-${String(max + 1).padStart(5, '0')}`;
}

function detectarIndicesCabecera(row) {
  const headers = row.map((c) => textoCelda(c).toLowerCase());
  const idxContenedor = headers.findIndex((h) => h.includes('contenedor'));
  const idxContenido = headers.findIndex((h) => h.includes('contenido'));
  const idxVenc = headers.findIndex((h) => h.includes('venc'));

  if (idxContenedor >= 0 || idxContenido >= 0 || idxVenc >= 0) {
    return {
      contenedor: idxContenedor,
      contenido: idxContenido,
      vencimiento: idxVenc,
    };
  }
  return null;
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

        let clienteActualId = null;
        let clienteActualNombre = '';
        let indices = { contenedor: 2, contenido: 8, vencimiento: 10 };
        let nuevos = 0;

        rows.forEach((row) => {
          const c0 = textoCelda(row[0]);
          if (!c0) return;

          const cliente = parsearClienteDesdeFila(row);
          if (cliente) {
            clienteActualId = cliente.id;
            clienteActualNombre = cliente.nombre;
            crearCliente({ id: cliente.id, nombre: cliente.nombre });
            return;
          }

          if (esFilaIgnorable(c0)) return;

          const cabeceraDetectada = detectarIndicesCabecera(row);
          if (cabeceraDetectada) {
            indices = {
              contenedor: cabeceraDetectada.contenedor >= 0 ? cabeceraDetectada.contenedor : indices.contenedor,
              contenido: cabeceraDetectada.contenido >= 0 ? cabeceraDetectada.contenido : indices.contenido,
              vencimiento: cabeceraDetectada.vencimiento >= 0 ? cabeceraDetectada.vencimiento : indices.vencimiento,
            };
            return;
          }

          // Fila de stock: primera columna con fecha
          if (!convertirAFecha(c0)) return;
          if (!clienteActualId || !clienteActualNombre) return;

          const contenedor = textoCelda(row[indices.contenedor]);
          const producto = textoCelda(row[indices.contenido]);
          const fechaVencimiento = textoCelda(row[indices.vencimiento]);

          if (!contenedor || !producto) return;

          crearContenedor(contenedor, contenedor);

          const id = generarSiguienteIdPallet();
          crearPallet({
            id,
            clienteId: clienteActualId,
            clienteNombre: clienteActualNombre,
            cliente: clienteActualNombre,
            producto,
            contenedor,
            fechaVencimiento,
            lote: '',
            kilos: 0,
            estado: ESTADOS_PALLET.EN_CAMARA,
          });
          nuevos += 1;
        });

        resolve({
          ok: true,
          nuevos,
          mensaje: `Importación finalizada. Pallets creados: ${nuevos}.`,
        });
      } catch (e) {
        reject(e);
      }
    };

    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}
