import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { EventosCocinaApp } from './modules/cocina/notifications/EventosCocinaApp';
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/kitchen/notifications');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div>
      <nav style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399' }}>Pruebas Cocina H30:</span>
        <button onClick={() => setCurrentPath('/kitchen/notifications')} style={{ background: currentPath === '/kitchen/notifications' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H26+H30: Eventos de Cocina</button>
        <button onClick={() => setCurrentPath('/kitchen')} style={{ background: currentPath === '/kitchen' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H6+H30: Comandas en Vivo</button>
      </nav>

      {currentPath === '/kitchen' ? (
        <ComandasCocinaApp onNavigate={handleNavigate} />
      ) : (
        <EventosCocinaApp onNavigate={handleNavigate} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);