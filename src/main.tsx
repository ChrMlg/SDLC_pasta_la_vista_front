import React from 'react';
import ReactDOM from 'react-dom/client';
import {  } from './modules/cocina/items/PlatillosComandaApp';
import { MeseroNotificacionesApp } from './modules/mesero/notifications/MeseroNotificacionesApp';

function MainTest() {
  return (
    <MeseroNotificacionesApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);