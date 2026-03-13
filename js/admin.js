import { resetClientes } from './clientes.js';
import { resetContenedores, initContenedoresCamara } from './contenedores.js';
import { resetStock } from './stock.js';
import { resetPedidos } from './pedidos.js';
import { resetCargas } from './cargas.js';

export function resetSistema() {
  if (confirm('¿Estás seguro de que deseas resetear todo el sistema? Esta acción no se puede deshacer.')) {
    resetClientes();
    resetContenedores();
    resetStock();
    resetPedidos();
    resetCargas();
    
    // Re-inicializar la grilla de la cámara
    initContenedoresCamara();
    
    alert('Sistema reseteado correctamente.');
    window.location.reload();
  }
}
