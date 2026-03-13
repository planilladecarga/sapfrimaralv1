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
        <div class="grid grid-cols-12 gap-2">
    `;

    grilla[fila].forEach(c => {
      let colorClass = 'bg-green-500 text-white'; // LIBRE
      if (c.estado === ESTADOS_CONTENEDOR.OCUPADO) {
        colorClass = 'bg-orange-500 text-white';
      } else if (c.estado === ESTADOS_CONTENEDOR.RESERVADO) {
        colorClass = 'bg-yellow-400 text-gray-800';
      }

      html += `
        <div class="flex flex-col items-center justify-center p-2 rounded ${colorClass} text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity" title="Estado: ${c.estado}">
          ${c.posicion}
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
      <div class="flex items-center"><span class="w-4 h-4 bg-green-500 rounded mr-2"></span> Libre</div>
      <div class="flex items-center"><span class="w-4 h-4 bg-orange-500 rounded mr-2"></span> Ocupado</div>
      <div class="flex items-center"><span class="w-4 h-4 bg-yellow-400 rounded mr-2"></span> Reservado</div>
    </div>
  `;

  container.innerHTML = html;
}
