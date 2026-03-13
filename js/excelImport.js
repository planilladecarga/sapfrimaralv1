import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

function obtenerNombreClienteDesdeFila(row) {
  const primera = String(row[0] || '').trim();
  const resto = row.slice(1).map((c) => String(c || '').trim()).filter(Boolean).join(' ');

  // Casos soportados:
  // 1) "Cliente: 435 ANTIC S.A."
  // 2) "Cliente:" + ["435", "ANTIC S.A."] en celdas siguientes
  // 3) "Cliente" sin ":" con datos en la misma o siguientes celdas
  const combinado = `${primera} ${resto}`.trim();
  const sinLabel = combinado.replace(/^cliente\s*:?\s*/i, '').trim();

  if (!sinLabel) return '';

  // Si empieza con código numérico, lo removemos para guardar solo nombre
  const match = sinLabel.match(/^\d+\s+(.+)$/);
  return (match ? match[1] : sinLabel).trim();
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

        rows.forEach((r) => {
          const c0 = String(r[0] || '').trim();
          const esFilaCliente = /^cliente\s*:?/i.test(c0);
          if (!c0 && !esFilaCliente) return;

          if (esFilaCliente) {
            const nombreCliente = obtenerNombreClienteDesdeFila(r);
            if (!nombreCliente) {
              clienteActual = null;
              return;
            }
            clienteActual = crearCliente(nombreCliente).nombre;
            return;
          }

          if (!clienteActual || /^(id|pallet)$/i.test(c0)) return;
          const [id, producto, lote, contenedor, kilos] = r;
          if (!id || !producto || !contenedor) return;

          crearContenedor(String(contenedor), String(contenedor));
          const existe = listarPallets().some((p) => Number(p.id) === Number(id));
          if (!existe) {
            crearPallet({ id, cliente: clienteActual, producto, lote, contenedor, kilos });
            nuevos += 1;
          }
        });

        resolve({ ok: true, nuevos });
      } catch (e) {
        reject(e);
      }
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}
