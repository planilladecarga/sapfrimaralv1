import { resetClientes } from './clientes.js';
import { resetContenedores, initContenedoresCamara } from './contenedores.js';
import { resetStock } from './stock.js';
import { resetPedidos } from './pedidos.js';
import { resetCargas } from './cargas.js';

let isAdminLoggedIn = false;

export function renderAdmin(container) {
  if (!isAdminLoggedIn) {
    container.innerHTML = `
      <h2 class="text-2xl font-bold mb-6 text-gray-800">Acceso Administrador</h2>
      <div class="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Usuario</label>
          <input type="text" id="admin-user" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">Clave</label>
          <input type="password" id="admin-pass" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        </div>
        <button id="btn-login" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Ingresar
        </button>
        <p id="login-error" class="text-red-500 text-sm mt-3 hidden">Usuario o clave incorrectos</p>
      </div>
    `;

    document.getElementById('btn-login').addEventListener('click', () => {
      const user = document.getElementById('admin-user').value;
      const pass = document.getElementById('admin-pass').value;
      
      if (user === '1111' && pass === '1111') {
        isAdminLoggedIn = true;
        renderAdmin(container);
      } else {
        document.getElementById('login-error').classList.remove('hidden');
      }
    });
    return;
  }

  container.innerHTML = `
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Panel de Administración</h2>
    <div class="bg-white p-6 rounded-lg shadow border border-red-200">
      <h3 class="text-lg font-bold text-red-600 mb-2">Zona de Peligro</h3>
      <p class="text-gray-600 mb-4">Las acciones aquí son irreversibles y afectarán a todos los datos del sistema.</p>
      
      <button id="btn-reset" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        Reiniciar Sistema
      </button>
    </div>
  `;
  
  document.getElementById('btn-reset').addEventListener('click', resetSistema);
}

export function resetSistema() {
  if (confirm('¿Estás seguro de que deseas reiniciar todo el sistema? Esta acción no se puede deshacer.')) {
    resetClientes();
    resetContenedores();
    resetStock();
    resetPedidos();
    resetCargas();
    
    // Re-inicializar la grilla de la cámara
    initContenedoresCamara();
    
    alert('Sistema reiniciado correctamente.');
    window.location.reload();
  }
}
