import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { LoginApp } from './modules/auth/LoginApp';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad';
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';
import { ClienteMenuApp } from './modules/cliente/menu/ClienteMenuApp';
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp'

type UserRole = 'MANAGER' | 'WAITER' | 'CUSTOMER' | 'KITCHEN' | null;

function MainTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPath, setCurrentPath] = useState('/management/menu');
  const [availabilityParams, setAvailabilityParams] = useState<any>(null);
  const [orderReviewData, setOrderReviewData] = useState<any>(null);
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);

  const handleNavigate = (path: string, params?: any) => {
    if (path.includes('/review') && params) {
      setOrderReviewData(params);
    } else if (path.includes('/kitchen') && typeof params === 'string') {
      setSelectedComandaId(params);
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
            setCurrentPath('/branches/menu');
          } else if (role === 'KITCHEN') {
            setCurrentPath('/kitchen');
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
          <nav
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '0.65rem 1.5rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#34d399' }}>Cliente:</span>
            <button
              type="button"
              onClick={() => setCurrentPath('/branches/menu')}
              style={{
                background: currentPath === '/branches/menu' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Ver menú (H3)
            </button>
            <button
              type="button"
              onClick={() => setCurrentPath('/orders/new')}
              style={{
                background: currentPath === '/orders/new' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Pedido autoservicio (H5)
            </button>
          </nav>

          {currentPath === '/branches/menu' && <ClienteMenuApp onNavigate={handleNavigate} />}

          {currentPath === '/orders/new' && <ClientePedidoApp onNavigate={handleNavigate} />}

          {currentPath === '/orders/review' && (
            <div style={{ padding: '2rem', color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
              <h2>Resumen del pedido</h2>
              <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px' }}>
                {JSON.stringify(orderReviewData, null, 2)}
              </pre>
              <button
                type="button"
                onClick={() => setCurrentPath('/orders/new')}
                style={{
                  background: '#059669',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '1rem',
                }}
              >
                ← Volver al menú
              </button>
            </div>
          )}
        </>
      )}

      {userRole === 'KITCHEN' && (
        <>
          {currentPath === '/kitchen' && <ComandasCocinaApp onNavigate={handleNavigate} />}

          {currentPath === '/kitchen/detail' && (
            <DetalleComandaApp
              comandaId={selectedComandaId || undefined}
              onNavigate={handleNavigate}
            />
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