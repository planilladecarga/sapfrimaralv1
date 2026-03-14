import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets, ESTADOS_PALLET } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

const ETIQUETAS_IGNORAR = ['fecha:', 'fecha hasta:', 'reporte:', 'totales:'];

function textoCelda(cell) {
  return String(cell || '').trim();
}

function normalizarNumeroDesdeExcel(valor) {
  const t = textoCelda(valor);
  if (!t) return NaN;
  const sinMiles = t.replace(/\./g, '').replace(/\s+/g, '');
  const normalizado = sinMiles.replace(',', '.');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : NaN;
}

function normalizarIdCliente(valor) {
  const t = textoCelda(valor);
  if (!t) return null;
  const digits = t.replace(/\D/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function esFilaIgnorable(c0) {
  const t = c0.toLowerCase();
  return ETIQUETAS_IGNORAR.some((x) => t.startsWith(x));
}

function parsearClienteDesdeFila(row) {
  const c0 = textoCelda(row[0]);
  if (!/^cliente\s*:?/i.test(c0)) return null;

  const idDesdeCol1 = normalizarIdCliente(row[1]);
  const nombreDesdeCol2 = textoCelda(row[2]);

  if (Number.isFinite(idDesdeCol1) && nombreDesdeCol2) {
    return { id: idDesdeCol1, nombre: nombreDesdeCol2 };
  }

  // Fallback: si viene todo junto en columna 0
  const combinado = [c0, ...row.slice(1).map(textoCelda).filter(Boolean)].join(' ').trim();
  const sinPrefijo = combinado.replace(/^cliente\s*:?\s*/i, '');
  const m = sinPrefijo.match(/^([\d\.]+)\s+(.+)$/);
  if (!m) return null;
  const id = normalizarIdCliente(m[1]);
  if (!id) return null;
  return { id, nombre: m[2].trim() };
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
  const idxContenido = headers.findIndex((h) => h.includes('contenido') || h.includes('descripcion'));
  const idxVenc = headers.findIndex((h) => h.includes('venc'));
  const idxPallet = headers.findIndex((h) => h === 'pallet' || h.includes('lote'));
  const idxCajas = headers.findIndex((h) => h.includes('cajas'));
  const idxKilos = headers.findIndex((h) => h.includes('kilos'));

  if (idxContenedor >= 0 || idxContenido >= 0 || idxVenc >= 0 || idxPallet >= 0 || idxCajas >= 0 || idxKilos >= 0) {
    return {
      contenedor: idxContenedor,
      contenido: idxContenido,
      vencimiento: idxVenc,
      lote: idxPallet,
      cajas: idxCajas,
      kilos: idxKilos,
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
        let indices = {
          contenedor: 2,
          contenido: 6,
          vencimiento: 10,
          lote: 3,
          cajas: 4,
          kilos: 5,
        };
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
              lote: cabeceraDetectada.lote >= 0 ? cabeceraDetectada.lote : indices.lote,
              cajas: cabeceraDetectada.cajas >= 0 ? cabeceraDetectada.cajas : indices.cajas,
              kilos: cabeceraDetectada.kilos >= 0 ? cabeceraDetectada.kilos : indices.kilos,
            };
            return;
          }

          // Fila de stock: primera columna con fecha
          if (!convertirAFecha(c0)) return;
          if (!clienteActualId || !clienteActualNombre) return;

          const contenedor = textoCelda(row[indices.contenedor]);
          const producto = textoCelda(row[indices.contenido]);
          const fechaVencimiento = textoCelda(row[indices.vencimiento]);
          const lote = textoCelda(row[indices.lote]);
          const cajas = normalizarNumeroDesdeExcel(row[indices.cajas]);
          const kilos = normalizarNumeroDesdeExcel(row[indices.kilos]);

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
            lote,
            cajas: Number.isFinite(cajas) ? cajas : 0,
            kilos: Number.isFinite(kilos) ? kilos : 0,
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
