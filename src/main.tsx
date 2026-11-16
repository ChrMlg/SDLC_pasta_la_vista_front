import React from 'react';
import ReactDOM from 'react-dom/client';
import {  } from './modules/cocina/items/PlatillosComandaApp';
import { RecogidaEntregaApp } from './modules/mesero/tracking/RecogidaEntregaApp';

function MainTest() {
  return (
    <RecogidaEntregaApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);