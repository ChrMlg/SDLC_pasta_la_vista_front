import React from 'react';
import ReactDOM from 'react-dom/client';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';
import {  } from './modules/cocina/items/PlatillosComandaApp';
import { PedidosAvisosMeseroApp } from './modules/mesero/tracking/PedidosAvisosMeseroApp';

function MainTest() {
  return (
    <PedidosAvisosMeseroApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);