import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { LoginApp } from './modules/auth/LoginApp';
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad';
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp';
import { PedidosAvisosMeseroApp, WaiterOrderNotification } from './modules/mesero/tracking/PedidosAvisosMeseroApp';
import { RecogidaEntregaApp } from './modules/mesero/tracking/RecogidaEntregaApp';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';
import { RevisarPedidoApp } from './modules/cliente/order/RevisarPedidoApp';
import { PedidoCreadoApp } from './modules/cliente/order/PedidoCreadoApp';
import { ClienteMenuApp } from './modules/cliente/menu/ClienteMenuApp';
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';
import { PlatillosComandaApp } from './modules/cocina/items/PlatillosComandaApp';

type UserRole = 'MANAGER' | 'WAITER' | 'CUSTOMER' | 'KITCHEN' | null;

function MainTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPath, setCurrentPath] = useState('/management/menu');
  const [availabilityParams, setAvailabilityParams] = useState<any>(null);
  const [orderReviewData, setOrderReviewData] = useState<any>(null);
  const [orderCreatedData, setOrderCreatedData] = useState<any>(null);
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [selectedWaiterOrder, setSelectedWaiterOrder] = useState<WaiterOrderNotification | null>(null);

  const handleNavigate = (path: string, params?: any) => {
    if (path.includes('/review') && params) {
      setOrderReviewData(params);
    } else if ((path.includes('/created') || path.includes('/my-orders')) && params) {
      setOrderCreatedData(params);
    } else if (path.includes('/waiter/orders/delivery') && params && typeof params === 'object') {
      setSelectedWaiterOrder(params);
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

      {userRole === 'WAITER' && (
        <>
          <nav
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center',
              fontSize: '0.85rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#34d399' }}>Mesero:</span>
            <button
              type="button"
              onClick={() => setCurrentPath('/waiter/orders/new')}
              style={{
                background: currentPath === '/waiter/orders/new' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Nuevo pedido (H4)
            </button>
            <button
              type="button"
              onClick={() => setCurrentPath('/waiter/orders')}
              style={{
                background: currentPath === '/waiter/orders' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Pedidos y avisos (H9 + H29)
            </button>
            <button
              type="button"
              onClick={() => setCurrentPath('/waiter/orders/delivery')}
              style={{
                background: currentPath === '/waiter/orders/delivery' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Recogida y entrega (H9)
            </button>
          </nav>

          {currentPath === '/waiter/orders/new' && <MeseroNuevoPedidoApp onNavigate={handleNavigate} />}

          {currentPath === '/waiter/orders' && <PedidosAvisosMeseroApp onNavigate={handleNavigate} />}

          {currentPath === '/waiter/orders/delivery' && (
            <RecogidaEntregaApp onNavigate={handleNavigate} selectedOrder={selectedWaiterOrder} />
          )}
        </>
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
              flexWrap: 'wrap',
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
            <button
              type="button"
              onClick={() => setCurrentPath('/orders/review')}
              style={{
                background: currentPath === '/orders/review' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Revisar pedido
            </button>
            <button
              type="button"
              onClick={() => setCurrentPath('/orders/created')}
              style={{
                background:
                  currentPath === '/orders/created' || currentPath === '/my-orders'
                    ? '#064e3b'
                    : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Pedido creado
            </button>
          </nav>

          {currentPath === '/branches/menu' && <ClienteMenuApp onNavigate={handleNavigate} />}

          {currentPath === '/orders/new' && <ClientePedidoApp onNavigate={handleNavigate} />}

          {currentPath === '/orders/review' && (
            <RevisarPedidoApp onNavigate={handleNavigate} orderData={orderReviewData} />
          )}

          {(currentPath === '/orders/created' || currentPath === '/my-orders') && (
            <PedidoCreadoApp onNavigate={handleNavigate} createdData={orderCreatedData} />
          )}
        </>
      )}

      {userRole === 'KITCHEN' && (
        <>
          <nav
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center',
              fontSize: '0.85rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 'bold', color: '#34d399' }}>Cocina:</span>
            <button
              type="button"
              onClick={() => setCurrentPath('/kitchen')}
              style={{
                background: currentPath === '/kitchen' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Comandas (H6)
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/kitchen/detail', selectedComandaId || 'preview-order-001')}
              style={{
                background: currentPath === '/kitchen/detail' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Tomar / Liberar (H7)
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/kitchen/items', selectedComandaId || 'preview-order-001')}
              style={{
                background: currentPath === '/kitchen/items' ? '#064e3b' : 'transparent',
                border: '1px solid #334155',
                color: '#fff',
                padding: '0.3rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Platillos (H8)
            </button>
          </nav>

          {currentPath === '/kitchen' && <ComandasCocinaApp onNavigate={handleNavigate} />}

          {currentPath === '/kitchen/detail' && (
            <DetalleComandaApp
              comandaId={selectedComandaId || undefined}
              onNavigate={handleNavigate}
            />
          )}

          {currentPath === '/kitchen/items' && (
            <PlatillosComandaApp
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