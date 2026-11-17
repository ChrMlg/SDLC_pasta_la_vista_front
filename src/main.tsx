import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MeseroNotificacionesApp } from './modules/mesero/notifications/MeseroNotificacionesApp';
import { PedidosAvisosMeseroApp } from './modules/mesero/tracking/PedidosAvisosMeseroApp';

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/notifications');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div>
      <nav style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399' }}>Pruebas H27 + H29 (Mesero):</span>
        <button onClick={() => setCurrentPath('/notifications')} style={{ background: currentPath === '/notifications' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>Notificaciones Mesero</button>
        <button onClick={() => setCurrentPath('/waiter/orders')} style={{ background: currentPath === '/waiter/orders' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H9: Pedidos y Avisos</button>
      </nav>

      {currentPath === '/waiter/orders' ? (
        <PedidosAvisosMeseroApp onNavigate={handleNavigate} />
      ) : (
        <MeseroNotificacionesApp onNavigate={handleNavigate} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);