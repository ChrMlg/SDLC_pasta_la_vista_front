import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { SessionProfile } from './shared/api-client';
import { LoginApp } from './modules/auth/LoginApp';

// Módulo 1: Menú Digital y Catálogo (H1, H2, H3)
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad';
import { ClienteMenuApp } from './modules/cliente/menu/ClienteMenuApp';

// Módulo 2: Pedidos (H4, H5)
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';
import { RevisarPedidoApp } from './modules/cliente/order/RevisarPedidoApp';
import { PedidoCreadoApp } from './modules/cliente/order/PedidoCreadoApp';

// Módulo 3: Cocina y Entrega (H6, H7, H8, H9)
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';
import { PlatillosComandaApp } from './modules/cocina/items/PlatillosComandaApp';
import {
  PedidosAvisosMeseroApp,
  WaiterOrderNotification,
} from './modules/mesero/tracking/PedidosAvisosMeseroApp';
import { RetirarEntregaApp } from './modules/mesero/tracking/RetirarEntregaApp';

// Módulo 9: Notificaciones (H26 - H30)
import { ClienteNotificacionesApp } from './modules/cliente/notifications/ClienteNotificacionesApp';
import { MeseroNotificacionesApp } from './modules/mesero/notifications/MeseroNotificacionesApp';
import { EventosCocinaApp } from './modules/cocina/notifications/EventosCocinaApp';

// Módulo 10: Analíticas y Reportes (H31 - H35)
import { ReporteVentasApp } from './modules/gerente-general/reports/ReporteVentasApp';
import { ComparativaSucursalesApp } from './modules/gerente-general/reports/ComparativaSucursalesApp';
import { PlatillosMasVendidosApp } from './modules/gerente-general/reports/PlatillosMasVendidosApp';
import { HorariosDemandaApp } from './modules/gerente-general/reports/HorariosDemandaApp';
import { SucursalesAtencionApp } from './modules/gerente-general/reports/SucursalesAtencionApp';

import { CompanionApp } from './modules/companion/CompanionApp';
import { isCompanionPath } from './modules/companion/companion-routes';

function getDefaultRouteForRole(role: SessionProfile['role']): string {
  switch (role) {
    case 'MANAGER':
      return '/management/menu';
    case 'WAITER':
      return '/waiter/orders/new';
    case 'CUSTOMER':
      return '/branches/menu';
    case 'KITCHEN':
      return '/kitchen';
    case 'GENERAL_MANAGER':
      return '/reports/sales';
    default:
      return '/management/menu';
  }
}

function AppShell() {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [currentPath, setCurrentPath] = useState('/management/menu');
  const [routeParams, setRouteParams] = useState<any>(null);
  const [navNonce, setNavNonce] = useState(0);
  const [selectedWaiterOrder, setSelectedWaiterOrder] =
    useState<WaiterOrderNotification | null>(null);

  const handleLoginSuccess = (profile: SessionProfile) => {
    setSession(profile);
    setCurrentPath(getDefaultRouteForRole(profile.role));
  };

  const handleNavigate = (path: string, params?: any) => {
    setNavNonce(n => n + 1);
    if (params !== undefined) {
      setRouteParams(params);
      if (path.includes('/waiter/orders/deliver')) {
        if (typeof params === 'object' && params !== null) {
          setSelectedWaiterOrder(params);
        } else if (typeof params === 'string') {
          setSelectedWaiterOrder({
            id: params,
            orderNumber: params,
            status: 'READY',
          } as any);
        }
      }
    }
    setCurrentPath(path);
  };

  if (!session) {
    return <LoginApp onLoginSuccess={handleLoginSuccess} />;
  }

  const role = session.role;

  const navButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#064e3b' : 'transparent',
    border: '1px solid #334155',
    color: '#ffffff',
    padding: '0.3rem 0.7rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  });

  return (
    <div>
      <nav
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.65rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#34d399', marginRight: '0.4rem' }}>
            Pasta la Vista · {role}
          </span>

          {role === 'MANAGER' && (
            <>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/management/menu')}
                onClick={() => handleNavigate('/management/menu')}
              >
                Menú sucursal (H1 + H2)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/management/menu/new')}
                onClick={() => handleNavigate('/management/menu/new')}
              >
                + Nuevo platillo (H1)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/management/inventory')}
                onClick={() => handleNavigate('/management/inventory')}
              >
                Inventario (Mód. 7)
              </button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/reservations')}
                onClick={() => handleNavigate('/management/reservations')}>Reservaciones (Mód. 5)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/ratings')}
                onClick={() => handleNavigate('/management/ratings')}>Calificaciones (Mód. 8)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/reviews')}
                onClick={() => handleNavigate('/reviews')}>Reseñas</button>
            </>
          )}

          {role === 'WAITER' && (
            <>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/waiter/orders/new')}
                onClick={() => handleNavigate('/waiter/orders/new')}
              >
                Tomar pedido (H4)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/waiter/orders')}
                onClick={() => handleNavigate('/waiter/orders')}
              >
                Seguimiento / Entrega (H9)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/notifications')}
                onClick={() => handleNavigate('/notifications')}
              >
                Notificaciones (H27 + H29)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/waiter/billing')}
                onClick={() => handleNavigate('/waiter/billing')}
              >
                Cuentas / Cobro (Mód. 6)
              </button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/reviews')}
                onClick={() => handleNavigate('/reviews')}>Reseñas (Mód. 8)</button>
            </>
          )}

          {role === 'CUSTOMER' && (
            <>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/branches/menu')}
                onClick={() => handleNavigate('/branches/menu')}
              >
                Ver menú (H3)
              </button>
              <button
                type="button"
                style={navButtonStyle(
                  currentPath === '/orders/new' ||
                    currentPath === '/orders/review' ||
                    currentPath === '/my-orders'
                )}
                onClick={() => handleNavigate('/orders/new')}
              >
                Pedido autoservicio (H5)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/notifications')}
                onClick={() => handleNavigate('/notifications')}
              >
                Notificaciones (H27 + H28)
              </button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/seating')}
                onClick={() => handleNavigate('/seating')}>Mesa (Mód. 4)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/reservations')}
                onClick={() => handleNavigate('/reservations')}>Reservar (Mód. 5)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/my-reservations')}
                onClick={() => handleNavigate('/my-reservations')}>Mis reservas</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/my-receipts')}
                onClick={() => handleNavigate('/my-receipts')}>Comprobantes (Mód. 6)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/my-reviews')}
                onClick={() => handleNavigate('/my-reviews')}>Calificar (Mód. 8)</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/my-loyalty')}
                onClick={() => handleNavigate('/my-loyalty')}>Mis puntos</button>
            </>
          )}

          {role === 'KITCHEN' && (
            <>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/kitchen')}
                onClick={() => handleNavigate('/kitchen')}
              >
                Comandas (H6)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/kitchen/detail')}
                onClick={() => handleNavigate('/kitchen/detail')}
              >
                Tomar / Liberar (H7)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/kitchen/items')}
                onClick={() => handleNavigate('/kitchen/items')}
              >
                Platillos listos (H8)
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/kitchen/notifications')}
                onClick={() => handleNavigate('/kitchen/notifications')}
              >
                Avisos Cocina (H26 + H30)
              </button>
            </>
          )}

          {role === 'GENERAL_MANAGER' && (
            <>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/reports/sales')}
                onClick={() => handleNavigate('/reports/sales')}
              >
                H31: Ventas
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/reports/comparison')}
                onClick={() => handleNavigate('/reports/comparison')}
              >
                H32: Comparativa
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/reports/top-dishes')}
                onClick={() => handleNavigate('/reports/top-dishes')}
              >
                H33: Top platillos
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/reports/peak-hours')}
                onClick={() => handleNavigate('/reports/peak-hours')}
              >
                H34: Horarios
              </button>
              <button
                type="button"
                style={navButtonStyle(currentPath === '/reports/performance')}
                onClick={() => handleNavigate('/reports/performance')}
              >
                H35: Atención
              </button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/reservations')}
                onClick={() => handleNavigate('/management/reservations')}>Reservaciones</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/inventory')}
                onClick={() => handleNavigate('/management/inventory')}>Inventario</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/ratings')}
                onClick={() => handleNavigate('/management/ratings')}>Calificaciones</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/reviews')}
                onClick={() => handleNavigate('/reviews')}>Reseñas</button>
              <button type="button" style={navButtonStyle(currentPath.split(/[?#]/)[0] === '/management/loyalty')}
                onClick={() => handleNavigate('/management/loyalty')}>Lealtad</button>
            </>
          )}
        </div>

        <button
          type="button"
          style={{
            background: '#dc2626',
            border: 'none',
            color: '#ffffff',
            padding: '0.35rem 0.75rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
          onClick={() => setSession(null)}
        >
          Cambiar usuario
        </button>
      </nav>

      {/* Vistas MANAGER */}
      {role === 'MANAGER' && (
        <>
          {currentPath === '/management/menu' && (
            <GerenteMenuApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {currentPath === '/management/menu/new' && (
            <NuevoPlatilloForm
              onNavigate={handleNavigate}
              defaultBranchId={routeParams?.branchId || session.branchId}
            />
          )}
          {currentPath.includes('/availability') && (
            <ConfirmarDisponibilidad
              branchId={routeParams?.branchId || session.branchId || undefined}
              itemId={routeParams?.itemId}
              dishName={routeParams?.dishName}
              currentAvailability={routeParams?.currentAvailability}
              onNavigate={handleNavigate}
            />
          )}
        </>
      )}

      {/* Vistas WAITER */}
      {role === 'WAITER' && (
        <>
          {currentPath === '/waiter/orders/new' && (
            <MeseroNuevoPedidoApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {currentPath === '/waiter/orders' && (
            <PedidosAvisosMeseroApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {(currentPath === '/waiter/orders/delivery' ||
            currentPath === '/waiter/orders/deliver') && (
            <RetirarEntregaApp
              onNavigate={handleNavigate}
              selectedOrder={selectedWaiterOrder
                ? { ...selectedWaiterOrder, type: selectedWaiterOrder.type ?? 'TAKEAWAY' }
                : null}
            />
          )}
          {currentPath === '/notifications' && (
            <MeseroNotificacionesApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas CUSTOMER */}
      {role === 'CUSTOMER' && (
        <>
          {currentPath === '/branches/menu' && (
            <ClienteMenuApp onNavigate={handleNavigate} />
          )}
          {currentPath === '/orders/new' && (
            <ClientePedidoApp onNavigate={handleNavigate} />
          )}
          {currentPath === '/orders/review' && (
            <RevisarPedidoApp onNavigate={handleNavigate} orderData={routeParams} />
          )}
          {currentPath === '/my-orders' && (
            <PedidoCreadoApp onNavigate={handleNavigate} createdData={routeParams} />
          )}
          {currentPath === '/notifications' && (
            <ClienteNotificacionesApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas KITCHEN */}
      {role === 'KITCHEN' && (
        <>
          {currentPath === '/kitchen' && (
            <ComandasCocinaApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {currentPath === '/kitchen/detail' && (
            <DetalleComandaApp
              branchId={routeParams?.branchId || session.branchId || undefined}
              orderId={routeParams?.orderId}
              initialOrder={routeParams?.order}
              onNavigate={handleNavigate}
            />
          )}
          {currentPath === '/kitchen/items' && (
            <PlatillosComandaApp
              branchId={routeParams?.branchId || session.branchId || undefined}
              orderId={routeParams?.orderId}
              onNavigate={handleNavigate}
            />
          )}
          {currentPath === '/kitchen/notifications' && (
            <EventosCocinaApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas GENERAL_MANAGER */}
      {role === 'GENERAL_MANAGER' && (
        <>
          {currentPath === '/reports/sales' && (
            <ReporteVentasApp onNavigate={handleNavigate} />
          )}
          {currentPath === '/reports/comparison' && (
            <ComparativaSucursalesApp onNavigate={handleNavigate} />
          )}
          {currentPath === '/reports/top-dishes' && <PlatillosMasVendidosApp />}
          {currentPath === '/reports/peak-hours' && <HorariosDemandaApp />}
          {currentPath === '/reports/performance' && <SucursalesAtencionApp />}
        </>
      )}
      {isCompanionPath(currentPath) && (
        <CompanionApp
          key={`${currentPath}#${navNonce}`}
          session={session}
          path={currentPath}
          routeParams={routeParams}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);