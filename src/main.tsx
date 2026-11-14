import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';
import { RevisarPedidoApp } from './modules/cliente/order/RevisarPedidoApp';

function MainTest() {
  const [currentPath, setCurrentPath] = useState('/orders/new');
  const [orderData, setOrderData] = useState<any>(null);

  const handleNavigate = (path: string, data?: any) => {
    if (data) setOrderData(data);
    setCurrentPath(path);
  };

  return (
    <div>
      <nav style={{ background: '#0f172a', color: '#fff', padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <span style={{ fontWeight: 'bold', color: '#34d399' }}>Prueba H5:</span>
        <button onClick={() => setCurrentPath('/orders/new')} style={{ background: currentPath === '/orders/new' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H5: Pedido Autoservicio</button>
        <button onClick={() => setCurrentPath('/orders/review')} style={{ background: currentPath === '/orders/review' ? '#064e3b' : 'transparent', border: '1px solid #334155', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer' }}>H4+H5: Revisar Pedido</button>
      </nav>

      {currentPath === '/orders/review' ? (
        <RevisarPedidoApp onNavigate={handleNavigate} orderData={orderData} />
      ) : (
        <ClientePedidoApp onNavigate={handleNavigate} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);