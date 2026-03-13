import { getContenedores, ESTADOS_CONTENEDOR } from './contenedores.js';

export function renderCamara(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const contenedores = getContenedores();
  
  // Agrupar por fila (A1, A2, A3, A4)
  const grilla = {
    'A1': [],
    'A2': [],
    'A3': [],
    'A4': []
  };

  contenedores.forEach(c => {
    const parts = c.posicion.split('-');
    if (parts.length === 2 && grilla[parts[0]]) {
      grilla[parts[0]].push(c);
    }
  });

  // Ordenar cada fila por número
  Object.keys(grilla).forEach(fila => {
    grilla[fila].sort((a, b) => {
      const numA = parseInt(a.posicion.split('-')[1]);
      const numB = parseInt(b.posicion.split('-')[1]);
      return numA - numB;
    });
  });

  let html = '<div class="grid grid-cols-1 gap-6">';

  Object.keys(grilla).forEach(fila => {
    html += `
      <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-3 text-gray-700 border-b pb-2">Fila ${fila}</h3>
        <div class="camara-grid">
    `;

    grilla[fila].forEach(c => {
      let colorClass = 'posicion-libre'; // LIBRE
      if (c.estado === ESTADOS_CONTENEDOR.OCUPADO) {
        colorClass = 'posicion-ocupado';
      } else if (c.estado === ESTADOS_CONTENEDOR.RESERVADO) {
        colorClass = 'posicion-reservado';
      }

      html += `
        <div class="flex flex-col items-center justify-center p-1 rounded ${colorClass} text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity" title="ID: ${c.id} | Estado: ${c.estado}">
          ${c.posicion.split('-')[1]}
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  
  // Leyenda
  html += `
    <div class="mt-6 flex space-x-4 bg-white p-4 rounded-lg shadow">
      <div class="flex items-center"><span class="w-4 h-4 posicion-libre rounded mr-2"></span> Libre</div>
      <div class="flex items-center"><span class="w-4 h-4 posicion-ocupado rounded mr-2"></span> Ocupado</div>
      <div class="flex items-center"><span class="w-4 h-4 posicion-reservado rounded mr-2"></span> Reservado</div>
    </div>
  `;

  container.innerHTML = html;
}
