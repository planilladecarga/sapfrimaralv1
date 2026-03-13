import * as XLSX from 'xlsx';
import { addCliente } from './clientes.js';
import { addPallet } from './stock.js';
import { addContenedor } from './contenedores.js';

export function procesarExcel(file, callback) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON, leyendo todas las filas como arrays
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      let clienteActual = null;
      let palletsImportados = 0;
      let clientesCreados = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Ignorar filas vacías
        if (!row || row.length === 0 || row.every(cell => cell === '')) continue;
        
        const primeraCelda = String(row[0]).trim();
        
        // Detectar si la fila indica un nuevo cliente
        // Ejemplo: "Cliente: 435 ANTIC SA"
        if (primeraCelda.toLowerCase().startsWith('cliente:')) {
          const nombreCliente = primeraCelda.substring(8).trim();
          clienteActual = addCliente(nombreCliente);
          clientesCreados++;
          continue; // Pasar a la siguiente fila
        }
        
        // Si ya tenemos un cliente actual y la fila tiene datos de pallet
        // Asumimos estructura: [Producto, Lote, Contenedor, Kilos] u otra similar
        // Ajustaremos esto según lo que parezca lógico:
        // Col 0: Producto, Col 1: Lote, Col 2: Contenedor, Col 3: Kilos
        if (clienteActual && primeraCelda !== '' && primeraCelda.toLowerCase() !== 'producto') {
          const producto = String(row[0] || '').trim();
          const lote = String(row[1] || '').trim();
          const posicionContenedor = String(row[2] || '').trim();
          const kilos = parseFloat(row[3]) || 0;
          
          if (producto && posicionContenedor) {
            // Asegurar que el contenedor existe
            const contenedor = addContenedor(posicionContenedor);
            
            // Crear el pallet
            addPallet(clienteActual.id, producto, lote, contenedor.id, kilos);
            palletsImportados++;
          }
        }
      }
      
      callback({
        success: true,
        message: `Importación exitosa. Clientes detectados: ${clientesCreados}. Pallets importados: ${palletsImportados}.`
      });
      
    } catch (error) {
      console.error("Error procesando Excel:", error);
      callback({
        success: false,
        message: "Error procesando el archivo Excel: " + error.message
      });
    }
  };

  reader.onerror = () => {
    callback({
      success: false,
      message: "Error al leer el archivo."
    });
  };

  reader.readAsArrayBuffer(file);
}
