import * as XLSX from 'xlsx';
import { crearCliente } from './clientes.js';
import { crearPallet, listarPallets } from './pallets.js';
import { crearContenedor, generarContenedoresBase } from './contenedores.js';

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
          if (!c0) return;

          if (/^cliente:/i.test(c0)) {
            const texto = c0.replace(/^cliente:/i, '').trim();
            const partes = texto.match(/^(\d+)?\s*(.*)$/);
            clienteActual = crearCliente((partes?.[2] || texto).trim()).nombre;
            return;
          }

          if (!clienteActual || /^id|pallet$/i.test(c0)) return;
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
