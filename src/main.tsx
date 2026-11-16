import React from 'react';
import ReactDOM from 'react-dom/client';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';
import { PlatillosComandaApp } from './modules/cocina/items/PlatillosComandaApp';

function MainTest() {
  return (
    <PlatillosComandaApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);