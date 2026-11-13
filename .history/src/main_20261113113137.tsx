import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import './app/globals.css'; // O tus estilos globales

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/management/menu');

  return (
    <div>
      {currentPath === '/management/menu/new' ? (
        <NuevoPlatilloForm onNavigate={setCurrentPath} />
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