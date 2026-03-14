import { crearCliente, listarClientes } from './clientes.js';
import { crearPallet, filtrarPallets, listarPallets } from './pallets.js';
import { crearPedido, listarPedidos } from './pedidos.js';
import { crearCarga, cargaSanJacinto, generarPlanillaCarga, listarCargas } from './cargas.js';
import { generarContenedoresBase } from './contenedores.js';
import { importarExcelStock } from './excelImport.js';
import { generarMapaCamara } from './mapaCamara.js';
import { loginAdmin, reiniciarSistema } from './admin.js';

const app = document.getElementById('app');
const tabs = document.getElementById('tabs');

const vistas = [
  ['dashboard', 'Dashboard'],
  ['clientes', 'Clientes'],
  ['pallets', 'Pallets'],
  ['pedidos', 'Pedidos'],
  ['cargas', 'Cargas'],
  ['camara', 'Mapa Cámara'],
  ['excel', 'Importar Excel'],
  ['admin', 'Admin'],
];

const estadoPedidosVista = {
  cliente: '',
  contenedor: '',
};

function renderTabs(activa) {
  tabs.innerHTML = vistas.map(([k, txt]) => `<button data-view="${k}" class="${activa === k ? 'active' : ''}">${txt}</button>`).join('');
  tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', (e) => renderVista(e.currentTarget.dataset.view)));
}

function rowsPallets(lista) {
  return lista.map((p) => `<tr><td>${p.id}</td><td>${p.cliente}</td><td>${p.producto}</td><td>${p.lote || ''}</td><td>${p.contenedor}</td><td>${p.kilos}</td><td>${p.cajas ?? ''}</td><td>${p.estado}</td></tr>`).join('');
}

function mostrarPlanillaSanJacinto(lista) {
  const contenedor = document.getElementById('resultadoCarga');
  let html = '<h3>Carga San Jacinto</h3><table border="1"><tr><th>Pallet</th><th>Producto</th><th>Lote</th><th>Kilos</th></tr>';
  lista.forEach((p) => {
    html += `<tr><td>${p.id}</td><td>${p.producto}</td><td>${p.lote || ''}</td><td>${p.kilos}</td></tr>`;
  });
  html += '</table>';
  contenedor.innerHTML = html;
}

function generarCargaSanJacinto() {
  const carga = cargaSanJacinto();
  mostrarPlanillaSanJacinto(carga);
}

window.generarCargaSanJacinto = generarCargaSanJacinto;

function renderVista(v) {
  renderTabs(v);
  if (v === 'dashboard') {
    app.innerHTML = `<section class="card"><h2>Resumen</h2><div class="row"><b>Clientes:</b> ${listarClientes().length}</div><div class="row"><b>Pallets:</b> ${listarPallets().length}</div><div class="row"><b>Pedidos:</b> ${listarPedidos().length}</div><div class="row"><b>Cargas:</b> ${listarCargas().length}</div></section>`;
  }

  if (v === 'clientes') {
    app.innerHTML = `<section class="card"><h2>Clientes</h2><div class="row"><input id="cli-nombre" placeholder="Nombre"/><button id="cli-add">Crear cliente</button></div><table><tr><th>ID</th><th>Nombre</th></tr>${listarClientes().map((c) => `<tr><td>${c.id}</td><td>${c.nombre}</td></tr>`).join('')}</table></section>`;
    document.getElementById('cli-add').onclick = () => { crearCliente(document.getElementById('cli-nombre').value); renderVista('clientes'); };
  }

  if (v === 'pallets') {
    const clientes = listarClientes().map((c) => `<option>${c.nombre}</option>`).join('');
    app.innerHTML = `<section class="card"><h2>Pallets</h2><div class="row"><input id="pa-id" placeholder="ID pallet"/><select id="pa-cliente"><option value="">Cliente</option>${clientes}</select><input id="pa-prod" placeholder="Producto"/><input id="pa-lote" placeholder="Lote"/><input id="pa-cont" placeholder="Contenedor"/><input id="pa-kilos" type="number" step="0.01" placeholder="Kilos"/><input id="pa-cajas" type="number" step="1" placeholder="Cajas"/><button id="pa-add">Crear pallet</button></div><hr><div class="row"><input id="f-cli" placeholder="Filtrar cliente"/><input id="f-pro" placeholder="Filtrar producto"/><input id="f-lote" placeholder="Filtrar lote"/><button id="pa-fil">Filtrar</button></div><table><tr><th>ID</th><th>Cliente</th><th>Producto</th><th>Lote</th><th>Cont</th><th>Kilos</th><th>Cajas</th><th>Estado</th></tr><tbody id="tb-pallets">${rowsPallets(listarPallets())}</tbody></table></section>`;
    document.getElementById('pa-add').onclick = () => {
      crearPallet({
        id: document.getElementById('pa-id').value,
        cliente: document.getElementById('pa-cliente').value,
        producto: document.getElementById('pa-prod').value,
        lote: document.getElementById('pa-lote').value,
        contenedor: document.getElementById('pa-cont').value,
        kilos: Number(document.getElementById('pa-kilos').value),
        cajas: Number(document.getElementById('pa-cajas').value),
      });
      renderVista('pallets');
    };
    document.getElementById('pa-fil').onclick = () => {
      const lista = filtrarPallets({ cliente: document.getElementById('f-cli').value, producto: document.getElementById('f-pro').value, lote: document.getElementById('f-lote').value });
      document.getElementById('tb-pallets').innerHTML = rowsPallets(lista);
    };
  }

  if (v === 'pedidos') {
    const clientesList = listarClientes();
    const palletsDisponibles = listarPallets().filter((p) => p.estado === 'EN_CAMARA');
    const clienteSeleccionado = estadoPedidosVista.cliente;
    const palletsCliente = clienteSeleccionado
      ? palletsDisponibles.filter((p) => String(p.cliente).toUpperCase() === String(clienteSeleccionado).toUpperCase())
      : [];

    const contenedoresCliente = [...new Set(palletsCliente.map((p) => p.contenedor).filter(Boolean))].sort();
    if (estadoPedidosVista.contenedor && !contenedoresCliente.includes(estadoPedidosVista.contenedor)) {
      estadoPedidosVista.contenedor = '';
    }

    const palletsFiltrados = estadoPedidosVista.contenedor
      ? palletsCliente.filter((p) => p.contenedor === estadoPedidosVista.contenedor)
      : palletsCliente;

    const opcionesP = palletsFiltrados.map((p) => {
      const maxCajas = Number(p.cajas) > 0 ? `max="${Number(p.cajas)}"` : '';
      const hint = Number(p.cajas) > 0 ? ` / Cajas disp.: ${p.cajas}` : '';
      return `<label class="row"><input type="checkbox" data-pallet-id="${p.id}"/> <span><b>${p.id}</b> · ${p.contenedor} · ${p.producto}${hint}</span><input type="number" min="1" ${maxCajas} step="1" data-cajas-id="${p.id}" placeholder="Cajas (opcional)"/></label>`;
    }).join('<hr>');

    app.innerHTML = `<section class="card"><h2>Pedidos (N° despacho)</h2>
      <div class="row">
        <input id="ped-desp" placeholder="N° despacho"/>
        <select id="ped-cli"><option value="">Cliente</option>${clientesList.map((c) => `<option value="${c.nombre}" ${c.nombre === clienteSeleccionado ? 'selected' : ''}>${c.id} · ${c.nombre}</option>`).join('')}</select>
        <select id="ped-cont"><option value="">Todos los contenedores</option>${contenedoresCliente.map((cont) => `<option value="${cont}" ${cont === estadoPedidosVista.contenedor ? 'selected' : ''}>${cont}</option>`).join('')}</select>
        <button id="ped-add">Crear pedido</button>
      </div>
      <div class="card">${opcionesP || '<small class="muted">Selecciona cliente para ver stock disponible.</small>'}</div>
      <table><tr><th>Despacho</th><th>Cliente</th><th>Pallets</th><th>Estado</th></tr>${listarPedidos().map((p) => `<tr><td>${p.id}</td><td>${p.cliente}</td><td>${p.pallets.join(', ')}</td><td>${p.estado}</td></tr>`).join('')}</table>
    </section>`;

    document.getElementById('ped-cli').onchange = (e) => {
      estadoPedidosVista.cliente = e.target.value;
      estadoPedidosVista.contenedor = '';
      renderVista('pedidos');
    };

    document.getElementById('ped-cont').onchange = (e) => {
      estadoPedidosVista.contenedor = e.target.value;
      renderVista('pedidos');
    };

    document.getElementById('ped-add').onclick = () => {
      try {
        const despacho = document.getElementById('ped-desp').value;
        const cliente = document.getElementById('ped-cli').value;
        const seleccion = [...app.querySelectorAll('input[type="checkbox"][data-pallet-id]:checked')]
          .map((check) => {
            const id = check.getAttribute('data-pallet-id');
            const cajasInput = app.querySelector(`input[data-cajas-id="${id}"]`);
            const cajas = Number(cajasInput?.value);
            return { id, cajas: Number.isFinite(cajas) && cajas > 0 ? cajas : null };
          });
        crearPedido(cliente, seleccion, despacho);
        renderVista('pedidos');
      } catch (error) {
        alert(error.message);
      }
    };
  }

  if (v === 'cargas') {
    const clientes = listarClientes().map((c) => `<option>${c.nombre}</option>`).join('');
    app.innerHTML = `<section class="card"><h2>Cargas</h2><div class="row"><select id="car-cli"><option value="">Cliente</option>${clientes}</select><button id="car-add">Crear carga desde pedido ABIERTO</button><button onclick="generarCargaSanJacinto()">CARGA SAN JACINTO</button></div><div id="resultadoCarga"></div><table><tr><th>ID</th><th>Cliente</th><th>Pallets</th><th>Fecha</th></tr>${listarCargas().map((c) => `<tr><td>${c.id}</td><td>${c.cliente}</td><td>${c.pallets.join(', ')}</td><td>${c.fecha}</td></tr>`).join('')}</table></section>`;
    document.getElementById('car-add').onclick = () => {
      try {
        const carga = crearCarga(document.getElementById('car-cli').value);
        const pallets = listarPallets().filter((p) => carga.pallets.includes(String(p.id)));
        const resumen = generarPlanillaCarga(pallets);
        alert(`Carga #${carga.id} creada. Pallets: ${resumen.cantidadPallets}. Kilos: ${resumen.totalKilos}.`);
        renderVista('cargas');
      } catch (error) {
        alert(error.message);
      }
    };
  }

  if (v === 'camara') {
    generarContenedoresBase();
    const mapa = generarMapaCamara();
    const filas = Object.entries(mapa).map(([f, lista]) => `<section class="card"><h3>${f}</h3><div class="grid-camara">${lista.map((c) => `<div class="pos ${c.estado === 'LIBRE' ? 'libre' : c.estado === 'RESERVADO' ? 'reservado' : 'ocupado'}" title="${c.id}">${c.posicion.split('-')[1]}</div>`).join('')}</div></section>`).join('');
    app.innerHTML = `${filas}<section class="card row"><span class="pos libre">&nbsp;</span> Libre <span class="pos ocupado">&nbsp;</span> Ocupado <span class="pos reservado">&nbsp;</span> Reservado</section>`;
  }

  if (v === 'excel') {
    app.innerHTML = `<section class="card"><h2>Importación Excel</h2><input type="file" id="excel" accept=".xlsx,.xls"/><button id="excel-btn">Importar</button><p id="excel-msg"></p></section>`;
    document.getElementById('excel-btn').onclick = async () => {
      const file = document.getElementById('excel').files[0];
      if (!file) return;
      const res = await importarExcelStock(file);
      document.getElementById('excel-msg').textContent = `Importación completada: ${res.nuevos} pallets nuevos.`;
    };
  }

  if (v === 'admin') {
    app.innerHTML = `<section class="card"><h2>Panel Administrador</h2><div class="row"><input id="ad-u" placeholder="usuario"/><input id="ad-p" type="password" placeholder="clave"/><button id="ad-login">Ingresar</button></div><div id="admin-box"></div></section>`;
    document.getElementById('ad-login').onclick = () => {
      const ok = loginAdmin(document.getElementById('ad-u').value, document.getElementById('ad-p').value);
      const box = document.getElementById('admin-box');
      if (!ok) { box.innerHTML = '<p>Credenciales inválidas.</p>'; return; }
      box.innerHTML = '<button id="reset">REINICIAR SISTEMA</button>';
      document.getElementById('reset').onclick = () => { reiniciarSistema(); alert('Sistema reiniciado.'); renderVista('dashboard'); };
    };
  }
}

generarContenedoresBase();
renderVista('dashboard');
