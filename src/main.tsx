import React from 'react';
import ReactDOM from 'react-dom/client';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';

function MainTest() {
  return (
    <DetalleComandaApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);