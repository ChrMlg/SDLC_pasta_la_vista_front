import React from 'react';
import ReactDOM from 'react-dom/client';
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';

function MainTest() {
  return (
    <ComandasCocinaApp onNavigate={() => {}} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);