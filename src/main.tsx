import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad';
import { ClienteMenuApp } from './modules/cliente/menu/ClienteMenuApp';
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp'; // <-- Importar nuevo módulo

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/waiter/orders/new');

  return (
    <div>
      {/* Barra superior de pruebas para alternar entre vistas */}
      <nav style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399' }}>Pruebas:</span>
        <button onClick={() => setCurrentPath('/management/menu')} style={{ background: currentPath === '/management/menu' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H1: Gerente</button>
        <button onClick={() => setCurrentPath('/management/menu/new')} style={{ background: currentPath === '/management/menu/new' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H1: Nuevo Platillo</button>
        <button onClick={() => setCurrentPath('/management/menu/1/availability')} style={{ background: currentPath.includes('/availability') ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H2: Disponibilidad</button>
        <button onClick={() => setCurrentPath('/branches/centro/menu')} style={{ background: currentPath.includes('/branches') ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H3: Cliente</button>
        <button onClick={() => setCurrentPath('/waiter/orders/new')} style={{ background: currentPath.includes('/waiter') ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H4: Mesero (Pedido)</button>
      </nav>

      {/* Renderizado condicional */}
      {currentPath === '/management/menu/new' ? (
        <NuevoPlatilloForm onNavigate={setCurrentPath} />
      ) : currentPath.includes('/availability') ? (
        <ConfirmarDisponibilidad onNavigate={setCurrentPath} />
      ) : currentPath.includes('/branches') ? (
        <ClienteMenuApp onNavigate={setCurrentPath} />
      ) : currentPath.includes('/waiter') ? (
        <MeseroNuevoPedidoApp onNavigate={setCurrentPath} />
      ) : (
        <GerenteMenuApp onNavigate={setCurrentPath} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);