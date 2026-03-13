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
        // Ejemplo: "Cliente: 435 ANTIC S.A."
        if (primeraCelda.toLowerCase().startsWith('cliente:')) {
          const clienteStr = primeraCelda.substring(8).trim(); // "435 ANTIC S.A."
          const match = clienteStr.match(/^(\d+)\s+(.+)$/);
          
          if (match) {
            const clienteId = parseInt(match[1]);
            const nombreCliente = match[2].trim();
            clienteActual = addCliente(clienteId, nombreCliente);
            clientesCreados++;
          }
          continue; // Pasar a la siguiente fila
        }
        
        // Si ya tenemos un cliente actual y la fila tiene datos de pallet
        // Asumimos estructura: [ID Pallet, Producto, Lote, Contenedor, Kilos]
        if (clienteActual && primeraCelda !== '' && primeraCelda.toLowerCase() !== 'id' && primeraCelda.toLowerCase() !== 'pallet') {
          const idPallet = String(row[0] || '').trim();
          const producto = String(row[1] || '').trim();
          const lote = String(row[2] || '').trim();
          const idContenedor = String(row[3] || '').trim();
          const kilos = parseFloat(row[4]) || 0;
          
          if (idPallet && producto && idContenedor) {
            // Asegurar que el contenedor existe, asumiendo que el ID del contenedor (ej. C20-118)
            // y la posición podrían ser lo mismo si no hay más datos, o podemos extraer la posición
            // Para simplificar, usamos el idContenedor como ID y como posición si no tenemos más info.
            // O podemos generar una posición aleatoria si no está en el excel, pero el prompt dice:
            // Contenedores: { id:"C20-118", posicion:"A2-05", estado:"OCUPADO" }
            // Asumiremos que el excel trae el ID del contenedor. La posición la asignaremos si existe,
            // o usaremos un valor por defecto si no está en la grilla.
            
            const contenedor = addContenedor(idContenedor, idContenedor); // Usamos ID como posición temporal si no existe
            
            // Crear el pallet
            addPallet(idPallet, clienteActual.id, producto, lote, contenedor.id, kilos);
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
