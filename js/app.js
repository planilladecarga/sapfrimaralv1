import { initContenedoresCamara } from './contenedores.js';
import { procesarExcel } from './importadorExcel.js';
import { renderCamara } from './camara.js';
import { renderAdmin } from './admin.js';
import { getClientes } from './clientes.js';
import { getStockEnCamara, getPallets, ESTADOS_PALLET } from './stock.js';
import { addPedido, getPedidos, ESTADOS_PEDIDO } from './pedidos.js';
import { addCarga, getCargas, finalizarCarga, ESTADOS_CARGA } from './cargas.js';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initContenedoresCamara();
  setupNavigation();
  loadView('dashboard');
});

// Navegación
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Actualizar estilo activo
      navButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const view = e.target.getAttribute('data-view');
      loadView(view);
    });
  });
}

function loadView(view) {
  const mainContent = document.getElementById('main-content');
  
  switch(view) {
    case 'dashboard':
      renderDashboard(mainContent);
      break;
    case 'importar':
      renderImportar(mainContent);
      break;
    case 'camara':
      renderCamaraView(mainContent);
      break;
    case 'pedidos':
      renderPedidos(mainContent);
      break;
    case 'cargas':
      renderCargas(mainContent);
      break;
    case 'admin':
      renderAdmin(mainContent);
      break;
    default:
      mainContent.innerHTML = '<h2 class="text-2xl font-bold">Vista no encontrada</h2>';
  }
}

// Vistas
function renderDashboard(container) {
  const clientes = getClientes();
  const pallets = getPallets();
  const pedidos = getPedidos();
  const cargas = getCargas();
  
  const palletsEnCamara = pallets.filter(p => p.estado === ESTADOS_PALLET.EN_CAMARA).length;
  
  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <h3 class="text-gray-500 text-sm font-bold uppercase">Clientes</h3>
        <p class="text-3xl font-bold text-gray-800">${clientes.length}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
        <h3 class="text-gray-500 text-sm font-bold uppercase">Pallets en Cámara</h3>
        <p class="text-3xl font-bold text-gray-800">${palletsEnCamara}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
        <h3 class="text-gray-500 text-sm font-bold uppercase">Pedidos Activos</h3>
        <p class="text-3xl font-bold text-gray-800">${pedidos.filter(p => p.estado !== ESTADOS_PEDIDO.COMPLETADO).length}</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
        <h3 class="text-gray-500 text-sm font-bold uppercase">Cargas en Proceso</h3>
        <p class="text-3xl font-bold text-gray-800">${cargas.filter(c => c.estado === ESTADOS_CARGA.PREPARANDO).length}</p>
      </div>
    </div>
  `;
}

function renderImportar(container) {
  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Importar Stock desde Excel</h2>
    <div class="bg-white p-8 rounded-lg shadow max-w-2xl">
      <div class="mb-6">
        <p class="text-gray-600 mb-4">El archivo Excel debe tener el formato especificado. Las filas que comiencen con "Cliente: [ID] [Nombre]" definirán el cliente para las filas siguientes.</p>
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
          <input type="file" id="excel-file" accept=".xlsx, .xls" class="hidden" />
          <label for="excel-file" class="cursor-pointer flex flex-col items-center">
            <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <span class="text-blue-600 font-medium">Haz clic para seleccionar un archivo</span>
            <span class="text-gray-500 text-sm mt-1">o arrastra y suelta aquí</span>
          </label>
        </div>
        <p id="file-name" class="mt-3 text-sm text-gray-600 text-center font-medium"></p>
      </div>
      <button id="btn-procesar" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
        Procesar Excel
      </button>
      <div id="import-result" class="mt-4 hidden p-4 rounded-md"></div>
    </div>
  `;

  const fileInput = document.getElementById('excel-file');
  const fileNameDisplay = document.getElementById('file-name');
  const btnProcesar = document.getElementById('btn-procesar');
  const resultDiv = document.getElementById('import-result');

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.textContent = `Archivo seleccionado: ${e.target.files[0].name}`;
      btnProcesar.disabled = false;
    } else {
      fileNameDisplay.textContent = '';
      btnProcesar.disabled = true;
    }
  });

  btnProcesar.addEventListener('click', () => {
    if (fileInput.files.length === 0) return;
    
    btnProcesar.disabled = true;
    btnProcesar.textContent = 'Procesando...';
    resultDiv.classList.add('hidden');
    
    procesarExcel(fileInput.files[0], (result) => {
      btnProcesar.textContent = 'Procesar Excel';
      btnProcesar.disabled = false;
      
      resultDiv.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
      if (result.success) {
        resultDiv.classList.add('bg-green-100', 'text-green-800');
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        btnProcesar.disabled = true;
      } else {
        resultDiv.classList.add('bg-red-100', 'text-red-800');
      }
      resultDiv.textContent = result.message;
    });
  });
}

function renderCamaraView(container) {
  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Mapa de Cámara Frigorífica</h2>
    <div id="camara-grid"></div>
  `;
  renderCamara('camara-grid');
}

function renderPedidos(container) {
  const clientes = getClientes();
  const stock = getStockEnCamara();
  const pedidos = getPedidos();
  
  let html = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Gestión de Pedidos</h2>
      <button id="btn-nuevo-pedido" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        + Nuevo Pedido
      </button>
    </div>
    
    <!-- Formulario Nuevo Pedido (Oculto por defecto) -->
    <div id="form-nuevo-pedido" class="bg-white p-6 rounded-lg shadow mb-8 hidden">
      <h3 class="text-lg font-bold mb-4 border-b pb-2">Crear Nuevo Pedido</h3>
      
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Seleccionar Cliente</label>
        <select id="select-cliente" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          <option value="">-- Seleccione un cliente --</option>
          ${clientes.map(c => `<option value="${c.id}">${c.id} - ${c.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div id="pallets-disponibles-container" class="mb-4 hidden">
        <label class="block text-gray-700 text-sm font-bold mb-2">Seleccionar Pallets (Stock en Cámara)</label>
        <div class="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50" id="lista-pallets">
          <!-- Se llena dinámicamente -->
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button id="btn-cancelar-pedido" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
        <button id="btn-guardar-pedido" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled>Guardar Pedido</button>
      </div>
    </div>
    
    <!-- Lista de Pedidos -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full leading-normal">
        <thead>
          <tr>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Pedido</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cant. Pallets</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (pedidos.length === 0) {
    html += `<tr><td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">No hay pedidos registrados</td></tr>`;
  } else {
    pedidos.forEach(p => {
      const cliente = clientes.find(c => c.id === p.cliente);
      const nombreCliente = cliente ? cliente.nombre : 'Desconocido';
      
      let badgeClass = 'bg-gray-200 text-gray-800';
      if (p.estado === ESTADOS_PEDIDO.CREADO) badgeClass = 'bg-yellow-200 text-yellow-800';
      if (p.estado === ESTADOS_PEDIDO.EN_PREPARACION) badgeClass = 'bg-blue-200 text-blue-800';
      if (p.estado === ESTADOS_PEDIDO.COMPLETADO) badgeClass = 'bg-green-200 text-green-800';
      
      html += `
        <tr>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap font-mono">${p.id}</p></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap">${nombreCliente}</p></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap">${p.pallets.length}</p></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><span class="relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${badgeClass}"><span class="relative text-xs">${p.estado}</span></span></td>
        </tr>
      `;
    });
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Eventos
  const btnNuevo = document.getElementById('btn-nuevo-pedido');
  const formNuevo = document.getElementById('form-nuevo-pedido');
  const btnCancelar = document.getElementById('btn-cancelar-pedido');
  const btnGuardar = document.getElementById('btn-guardar-pedido');
  const selectCliente = document.getElementById('select-cliente');
  const containerPallets = document.getElementById('pallets-disponibles-container');
  const listaPallets = document.getElementById('lista-pallets');
  
  btnNuevo.addEventListener('click', () => {
    formNuevo.classList.remove('hidden');
    btnNuevo.classList.add('hidden');
  });
  
  btnCancelar.addEventListener('click', () => {
    formNuevo.classList.add('hidden');
    btnNuevo.classList.remove('hidden');
    selectCliente.value = '';
    containerPallets.classList.add('hidden');
  });
  
  selectCliente.addEventListener('change', (e) => {
    const clienteId = e.target.value;
    if (!clienteId) {
      containerPallets.classList.add('hidden');
      btnGuardar.disabled = true;
      return;
    }
    
    // Filtrar pallets del cliente que estén en cámara
    const palletsCliente = stock.filter(p => p.cliente === parseInt(clienteId));
    
    if (palletsCliente.length === 0) {
      listaPallets.innerHTML = '<p class="text-sm text-gray-500 p-2">Este cliente no tiene pallets disponibles en cámara.</p>';
      btnGuardar.disabled = true;
    } else {
      listaPallets.innerHTML = palletsCliente.map(p => `
        <label class="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
          <input type="checkbox" class="pallet-checkbox form-checkbox h-4 w-4 text-blue-600" value="${p.id}">
          <span class="ml-2 text-sm text-gray-700">ID: <b>${p.id}</b> | Prod: <b>${p.producto}</b> | Lote: ${p.lote} | Kilos: ${p.kilos} | Pos: ${p.contenedor}</span>
        </label>
      `).join('');
      
      // Escuchar cambios en checkboxes
      const checkboxes = document.querySelectorAll('.pallet-checkbox');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const seleccionados = document.querySelectorAll('.pallet-checkbox:checked').length;
          btnGuardar.disabled = seleccionados === 0;
        });
      });
    }
    
    containerPallets.classList.remove('hidden');
  });
  
  btnGuardar.addEventListener('click', () => {
    const clienteId = selectCliente.value;
    const checkboxes = document.querySelectorAll('.pallet-checkbox:checked');
    const palletIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (clienteId && palletIds.length > 0) {
      addPedido(clienteId, palletIds);
      renderPedidos(container); // Recargar vista
    }
  });
}

function renderCargas(container) {
  const pedidos = getPedidos().filter(p => p.estado === ESTADOS_PEDIDO.CREADO);
  const cargas = getCargas();
  const clientes = getClientes();
  
  let html = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Preparación de Cargas</h2>
      <div>
        <button id="btn-san-jacinto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Preparar Carga San Jacinto
        </button>
        <button id="btn-nueva-carga" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          + Preparar Carga
        </button>
      </div>
    </div>
    
    <div id="resultadoCarga" class="mb-6 bg-white p-4 rounded-lg shadow empty:hidden"></div>
    
    <!-- Formulario Nueva Carga -->
    <div id="form-nueva-carga" class="bg-white p-6 rounded-lg shadow mb-8 hidden">
      <h3 class="text-lg font-bold mb-4 border-b pb-2">Preparar Nueva Carga</h3>
      
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">Seleccionar Pedido Creado</label>
        <select id="select-pedido" class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
          <option value="">-- Seleccione un pedido --</option>
          ${pedidos.map(p => {
            const cliente = clientes.find(c => c.id === p.cliente);
            return `<option value="${p.id}">Pedido ${p.id} - ${cliente ? cliente.nombre : ''} (${p.pallets.length} pallets)</option>`;
          }).join('')}
        </select>
      </div>
      
      <div class="flex justify-end space-x-3 mt-4">
        <button id="btn-cancelar-carga" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
        <button id="btn-iniciar-carga" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled>Iniciar Carga</button>
      </div>
    </div>
    
    <!-- Lista de Cargas -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full leading-normal">
        <thead>
          <tr>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Carga</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pedido Relacionado</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
            <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  if (cargas.length === 0) {
    html += `<tr><td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">No hay cargas registradas</td></tr>`;
  } else {
    cargas.forEach(c => {
      let badgeClass = 'bg-gray-200 text-gray-800';
      if (c.estado === ESTADOS_CARGA.PREPARANDO) badgeClass = 'bg-yellow-200 text-yellow-800';
      if (c.estado === ESTADOS_CARGA.FINALIZADA) badgeClass = 'bg-green-200 text-green-800';
      
      const isPreparando = c.estado === ESTADOS_CARGA.PREPARANDO;
      
      html += `
        <tr>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap font-mono">${c.id}</p></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p class="text-gray-900 whitespace-no-wrap font-mono">${c.pedido}</p></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><span class="relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${badgeClass}"><span class="relative text-xs">${c.estado}</span></span></td>
          <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
            ${isPreparando ? `<button class="btn-finalizar-carga bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded" data-id="${c.id}">Despachar</button>` : '-'}
          </td>
        </tr>
      `;
    });
  }
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Eventos
  const btnNueva = document.getElementById('btn-nueva-carga');
  const formNueva = document.getElementById('form-nueva-carga');
  const btnCancelar = document.getElementById('btn-cancelar-carga');
  const btnIniciar = document.getElementById('btn-iniciar-carga');
  const selectPedido = document.getElementById('select-pedido');
  const btnSanJacinto = document.getElementById('btn-san-jacinto');
  
  if (btnSanJacinto) {
    btnSanJacinto.addEventListener('click', generarCargaSanJacinto);
  }
  
  btnNueva.addEventListener('click', () => {
    formNueva.classList.remove('hidden');
    btnNueva.classList.add('hidden');
  });
  
  btnCancelar.addEventListener('click', () => {
    formNueva.classList.add('hidden');
    btnNueva.classList.remove('hidden');
    selectPedido.value = '';
    btnIniciar.disabled = true;
  });
  
  selectPedido.addEventListener('change', (e) => {
    btnIniciar.disabled = !e.target.value;
  });
  
  btnIniciar.addEventListener('click', () => {
    const pedidoId = selectPedido.value;
    if (pedidoId) {
      addCarga(pedidoId);
      renderCargas(container); // Recargar vista
    }
  });
  
  // Botones de finalizar
  document.querySelectorAll('.btn-finalizar-carga').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cargaId = e.target.getAttribute('data-id');
      if (confirm('¿Confirmar que la carga ha sido despachada? Esto liberará los contenedores en la cámara.')) {
        finalizarCarga(cargaId);
        renderCargas(container);
      }
    });
  });
}

// FUNCIÓN ORIGINAL "CARGA SAN JACINTO" ADAPTADA AL NUEVO MODELO
function generarCargaSanJacinto(){
  // Adaptado para usar la key wms_pallets y wms_clientes del nuevo sistema
  let pallets = JSON.parse(localStorage.getItem("wms_pallets")) || [];
  let clientes = JSON.parse(localStorage.getItem("wms_clientes")) || [];

  let carga = [];

  pallets.forEach(p => {
    const cliente = clientes.find(c => c.id === p.cliente);
    const nombreCliente = cliente ? cliente.nombre : '';

    if(
      nombreCliente.toUpperCase().includes("SAN JACINTO") &&
      p.estado === "EN_CAMARA"
    ){
      carga.push(p);
      p.estado = "EN_CARGA";
    }
  });

  localStorage.setItem("wms_pallets", JSON.stringify(pallets));

  mostrarPlanillaSanJacinto(carga);
}

function mostrarPlanillaSanJacinto(lista){
  let contenedor = document.getElementById("resultadoCarga");
  if (!contenedor) return;

  let html = "";

  html += "<h3 class='text-lg font-bold mb-4'>Carga San Jacinto</h3>";

  html += "<table border='1' class='w-full text-left border-collapse border border-gray-300'>";
  html += "<tr class='bg-gray-100'>";
  html += "<th class='border border-gray-300 px-4 py-2'>Pallet</th>";
  html += "<th class='border border-gray-300 px-4 py-2'>Producto</th>";
  html += "<th class='border border-gray-300 px-4 py-2'>Lote</th>";
  html += "<th class='border border-gray-300 px-4 py-2'>Kilos</th>";
  html += "</tr>";

  if (lista.length === 0) {
    html += "<tr><td colspan='4' class='border border-gray-300 px-4 py-2 text-center text-gray-500'>No se encontraron pallets en cámara para San Jacinto</td></tr>";
  } else {
    lista.forEach(p => {
      html += "<tr>";
      html += "<td class='border border-gray-300 px-4 py-2'>" + p.id + "</td>";
      html += "<td class='border border-gray-300 px-4 py-2'>" + p.producto + "</td>";
      html += "<td class='border border-gray-300 px-4 py-2'>" + p.lote + "</td>";
      html += "<td class='border border-gray-300 px-4 py-2'>" + p.kilos + "</td>";
      html += "</tr>";
    });
  }

  html += "</table>";

  contenedor.innerHTML = html;
  contenedor.classList.remove('hidden');
}
