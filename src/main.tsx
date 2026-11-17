import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ClienteNotificacionesApp } from './modules/cliente/notifications/ClienteNotificacionesApp';
import { ReporteVentasApp } from './modules/gerente-general/reports/ReporteVentasApp';
import { ComparativaSucursalesApp } from './modules/gerente-general/reports/ComparativaSucursalesApp';

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/notifications');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div>
          <ComparativaSucursalesApp onNavigate={handleNavigate} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);