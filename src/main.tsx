import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { LoginApp } from './modules/auth/LoginApp';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad'; 
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';


type UserRole = 'MANAGER' | 'WAITER' | 'CUSTOMER' | null;

function MainTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPath, setCurrentPath] = useState('/management/menu');
  const [availabilityParams, setAvailabilityParams] = useState<any>(null);
  const [orderReviewData, setOrderReviewData] = useState<any>(null); 

  const handleNavigate = (path: string, params?: any) => {
    if (path.includes('/review') && params) {
      setOrderReviewData(params);
    } else if (params) {
      setAvailabilityParams(params);
    }
    setCurrentPath(path);
  };

  if (!isAuthenticated) {
    return (
      <LoginApp 
        onLoginSuccess={(role: UserRole = 'MANAGER') => {
          setUserRole(role);
          setIsAuthenticated(true);
          
          // Redirección inicial según el rol detectado
          if (role === 'WAITER') {
            setCurrentPath('/waiter/orders/new');
          } else if (role === 'CUSTOMER') {
            setCurrentPath('/orders/new');
          } else {
            setCurrentPath('/management/menu');
          }
        }} 
      />
    );
  }

  return (
    <div>
      {userRole === 'MANAGER' && (
        <>
          {currentPath === '/management/menu' && <GerenteMenuApp onNavigate={handleNavigate} />}
          {currentPath === '/management/menu/new' && <NuevoPlatilloForm onNavigate={handleNavigate} />}
          {currentPath.includes('/availability') && (
            <ConfirmarDisponibilidad 
              branchId="a1111111-1111-4111-8111-111111111111"
              itemId={availabilityParams?.itemId}
              dishName={availabilityParams?.dishName}
              currentAvailability={availabilityParams?.currentAvailability}
              onNavigate={handleNavigate} 
            />
          )}
        </>
      )}

      {userRole === 'WAITER' && currentPath.includes('/waiter') && (
        <MeseroNuevoPedidoApp onNavigate={handleNavigate} />
      )}


      {userRole === 'CUSTOMER' && (
        <>
          {currentPath === '/orders/new' && <ClientePedidoApp onNavigate={handleNavigate} />}

          {currentPath === '/orders/review' && (
            <div style={{ padding: '2rem', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
              <h2>Resumen del pedido</h2>
              <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                {JSON.stringify(orderReviewData, null, 2)}
              </pre>
              <button 
                onClick={() => setCurrentPath('/orders/new')}
                style={{ background: '#059669', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}
              >
                ← Volver al menú
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainTest />
  </React.StrictMode>
);