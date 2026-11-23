import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { SessionProfile, syncBranchesFromApi } from './shared/api-client';
import { LoginApp } from './modules/auth/LoginApp';
import { RegisterCustomerApp } from './modules/auth/ResgisterCustomerApp';
import './app.css';

// Módulo 1: Menú y Catálogo
import { GerenteMenuApp } from './modules/gerente/menu/GerenteMenuApp';
import { NuevoPlatilloForm } from './modules/gerente/menu/NuevoPlatilloForm';
import { ConfirmarDisponibilidad } from './modules/gerente/menu/ConfirmarDisponibilidad';
import { ClienteMenuApp } from './modules/cliente/menu/ClienteMenuApp';

// Módulo 2: Pedidos
import { MeseroNuevoPedidoApp } from './modules/mesero/order/MeseroNuevoPedidoApp';
import { ClientePedidoApp } from './modules/cliente/order/ClientePedidoApp';
import { RevisarPedidoApp } from './modules/cliente/order/RevisarPedidoApp';
import { PedidoCreadoApp } from './modules/cliente/order/PedidoCreadoApp';

// Cocina y Seguimiento de Mesero
import { ComandasCocinaApp } from './modules/cocina/kitchen/ComandasCocinaApp';
import { DetalleComandaApp } from './modules/cocina/kitchen/DetalleComandaApp';
import { PlatillosComandaApp } from './modules/cocina/items/PlatillosComandaApp';
import {
  PedidosAvisosMeseroApp,
  WaiterOrderNotification,
} from './modules/mesero/tracking/PedidosAvisosMeseroApp';
import { RetirarEntregaApp } from './modules/mesero/tracking/RetirarEntregaApp';

// Módulo 9: Notificaciones
import { ClienteNotificacionesApp } from './modules/cliente/notifications/ClienteNotificacionesApp';
import { MeseroNotificacionesApp } from './modules/mesero/notifications/MeseroNotificacionesApp';
import { EventosCocinaApp } from './modules/cocina/notifications/EventosCocinaApp';

// Módulo 10: Analíticas y Reportes
import { ReporteVentasApp } from './modules/gerente-general/reports/ReporteVentasApp';
import { ComparativaSucursalesApp } from './modules/gerente-general/reports/ComparativaSucursalesApp';
import { PlatillosMasVendidosApp } from './modules/gerente-general/reports/PlatillosMasVendidosApp';
import { HorariosDemandaApp } from './modules/gerente-general/reports/HorariosDemandaApp';
import { SucursalesAtencionApp } from './modules/gerente-general/reports/SucursalesAtencionApp';

// Companion / Rutas compartidas
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

function normalizePath(path: string): string {
  return path.split(/[?#]/)[0] || '/';
}

function navButtonClass(active: boolean): string {
  return active ? 'app-nav-btn app-nav-btn--active' : 'app-nav-btn';
}

function AppShell() {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [prefilledLoginEmail, setPrefilledLoginEmail] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [currentPath, setCurrentPath] = useState('/management/menu');
  const [routeParams, setRouteParams] = useState<any>(null);
  const [navNonce, setNavNonce] = useState(0);
  const [selectedWaiterOrder, setSelectedWaiterOrder] =
    useState<WaiterOrderNotification | null>(null);

  const cleanPath = normalizePath(currentPath);

  const handleLoginSuccess = async (profile: SessionProfile) => {
    await syncBranchesFromApi();
    setSession(profile);
    setLoginNotice('');
    setRouteParams(null);
    setSelectedWaiterOrder(null);
    setCurrentPath(getDefaultRouteForRole(profile.role));
  };

  const handleLogout = () => {
    setSession(null);
    setAuthView('login');
    setLoginNotice('');
    setRouteParams(null);
    setSelectedWaiterOrder(null);
    setCurrentPath('/management/menu');
  };

  const handleNavigate = (path: string, params?: any) => {
    setNavNonce((n) => n + 1);
    setRouteParams(params !== undefined ? params : null);

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

    setCurrentPath(path);
  };

  if (!session) {
    if (authView === 'register') {
      return (
        <RegisterCustomerApp
          onBackToLogin={(registeredEmail, noticeMessage) => {
            if (registeredEmail) setPrefilledLoginEmail(registeredEmail);
            if (noticeMessage) setLoginNotice(noticeMessage);
            setAuthView('login');
          }}
        />
      );
    }

    return (
      <LoginApp
        onLoginSuccess={(profile) => {
          void handleLoginSuccess(profile);
        }}
        onOpenRegister={() => {
          setLoginNotice('');
          setAuthView('register');
        }}
        initialEmail={prefilledLoginEmail}
        initialNotice={loginNotice}
      />
    );
  }

  const role = session.role;

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav-links">
          <span className="app-brand-badge">
            Pasta la Vista · {role}
          </span>

          {role === 'MANAGER' && (
            <>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/menu')}
                onClick={() => handleNavigate('/management/menu')}
              >
                Menú sucursal
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/menu/new')}
                onClick={() => handleNavigate('/management/menu/new')}
              >
                Nuevo platillo
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/inventory')}
                onClick={() => handleNavigate('/management/inventory')}
              >
                Inventario
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/reservations')}
                onClick={() => handleNavigate('/management/reservations')}
              >
                Reservaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/ratings')}
                onClick={() => handleNavigate('/management/ratings')}
              >
                Calificaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reviews')}
                onClick={() => handleNavigate('/reviews')}
              >
                Reseñas
              </button>
            </>
          )}

          {role === 'WAITER' && (
            <>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/waiter/orders/new')}
                onClick={() => handleNavigate('/waiter/orders/new')}
              >
                Tomar pedido
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/waiter/orders')}
                onClick={() => handleNavigate('/waiter/orders')}
              >
                Seguimiento / Entrega
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/notifications')}
                onClick={() => handleNavigate('/notifications')}
              >
                Notificaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/waiter/billing')}
                onClick={() => handleNavigate('/waiter/billing')}
              >
                Cuentas / Cobro
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reviews')}
                onClick={() => handleNavigate('/reviews')}
              >
                Reseñas
              </button>
            </>
          )}

          {role === 'CUSTOMER' && (
            <>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/branches/menu')}
                onClick={() => handleNavigate('/branches/menu')}
              >
                Ver menú
              </button>
              <button
                type="button"
                className={navButtonClass(
                  cleanPath === '/orders/new' ||
                    cleanPath === '/orders/review' ||
                    cleanPath === '/my-orders'
                )}
                onClick={() => handleNavigate('/orders/new')}
              >
                Pedido autoservicio
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/notifications')}
                onClick={() => handleNavigate('/notifications')}
              >
                Notificaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/seating')}
                onClick={() => handleNavigate('/seating')}
              >
                Mesa
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reservations')}
                onClick={() => handleNavigate('/reservations')}
              >
                Reservar
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/my-reservations')}
                onClick={() => handleNavigate('/my-reservations')}
              >
                Mis reservas
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/my-receipts')}
                onClick={() => handleNavigate('/my-receipts')}
              >
                Comprobantes
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/my-reviews')}
                onClick={() => handleNavigate('/my-reviews')}
              >
                Calificar
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/my-loyalty')}
                onClick={() => handleNavigate('/my-loyalty')}
              >
                Mis puntos
              </button>
            </>
          )}

          {role === 'KITCHEN' && (
            <>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/kitchen')}
                onClick={() => handleNavigate('/kitchen')}
              >
                Comandas
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/kitchen/detail')}
                onClick={() => handleNavigate('/kitchen/detail')}
              >
                Tomar / Liberar
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/kitchen/items')}
                onClick={() => handleNavigate('/kitchen/items')}
              >
                Platillos listos
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/kitchen/notifications')}
                onClick={() => handleNavigate('/kitchen/notifications')}
              >
                Avisos de cocina
              </button>
            </>
          )}

          {role === 'GENERAL_MANAGER' && (
            <>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reports/sales')}
                onClick={() => handleNavigate('/reports/sales')}
              >
                Ventas
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reports/comparison')}
                onClick={() => handleNavigate('/reports/comparison')}
              >
                Comparativa
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reports/top-dishes')}
                onClick={() => handleNavigate('/reports/top-dishes')}
              >
                Top platillos
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reports/peak-hours')}
                onClick={() => handleNavigate('/reports/peak-hours')}
              >
                Horarios
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reports/performance')}
                onClick={() => handleNavigate('/reports/performance')}
              >
                Atención
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/reservations')}
                onClick={() => handleNavigate('/management/reservations')}
              >
                Reservaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/inventory')}
                onClick={() => handleNavigate('/management/inventory')}
              >
                Inventario
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/ratings')}
                onClick={() => handleNavigate('/management/ratings')}
              >
                Calificaciones
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/reviews')}
                onClick={() => handleNavigate('/reviews')}
              >
                Reseñas
              </button>
              <button
                type="button"
                className={navButtonClass(cleanPath === '/management/loyalty')}
                onClick={() => handleNavigate('/management/loyalty')}
              >
                Lealtad
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="app-logout-btn"
          onClick={handleLogout}
        >
          Cambiar usuario
        </button>
      </nav>

      {/* Vistas MANAGER */}
      {role === 'MANAGER' && (
        <>
          {cleanPath === '/management/menu' && (
            <GerenteMenuApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {cleanPath === '/management/menu/new' && (
            <NuevoPlatilloForm
              onNavigate={handleNavigate}
              defaultBranchId={routeParams?.branchId || session.branchId}
            />
          )}
          {cleanPath.includes('/availability') && (
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
          {cleanPath === '/waiter/orders/new' && (
            <MeseroNuevoPedidoApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {cleanPath === '/waiter/orders' && (
            <PedidosAvisosMeseroApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {(cleanPath === '/waiter/orders/delivery' ||
            cleanPath === '/waiter/orders/deliver') && (
            <RetirarEntregaApp
              onNavigate={handleNavigate}
              selectedOrder={
                selectedWaiterOrder
                  ? { ...selectedWaiterOrder, type: selectedWaiterOrder.type ?? 'TAKEAWAY' }
                  : null
              }
            />
          )}
          {cleanPath === '/notifications' && (
            <MeseroNotificacionesApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas CUSTOMER */}
      {role === 'CUSTOMER' && (
        <>
          {cleanPath === '/branches/menu' && (
            <ClienteMenuApp onNavigate={handleNavigate} />
          )}
          {cleanPath === '/orders/new' && (
            <ClientePedidoApp onNavigate={handleNavigate} />
          )}
          {cleanPath === '/orders/review' && (
            <RevisarPedidoApp onNavigate={handleNavigate} orderData={routeParams} />
          )}
          {cleanPath === '/my-orders' && (
            <PedidoCreadoApp onNavigate={handleNavigate} createdData={routeParams} />
          )}
          {cleanPath === '/notifications' && (
            <ClienteNotificacionesApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas KITCHEN */}
      {role === 'KITCHEN' && (
        <>
          {cleanPath === '/kitchen' && (
            <ComandasCocinaApp
              onNavigate={handleNavigate}
              defaultBranchId={session.branchId}
            />
          )}
          {cleanPath === '/kitchen/detail' && (
            <DetalleComandaApp
              branchId={routeParams?.branchId || session.branchId || undefined}
              orderId={routeParams?.orderId}
              initialOrder={routeParams?.order}
              onNavigate={handleNavigate}
            />
          )}
          {cleanPath === '/kitchen/items' && (
            <PlatillosComandaApp
              branchId={routeParams?.branchId || session.branchId || undefined}
              orderId={routeParams?.orderId}
              onNavigate={handleNavigate}
            />
          )}
          {cleanPath === '/kitchen/notifications' && (
            <EventosCocinaApp onNavigate={handleNavigate} />
          )}
        </>
      )}

      {/* Vistas GENERAL_MANAGER */}
      {role === 'GENERAL_MANAGER' && (
        <>
          {cleanPath === '/reports/sales' && (
            <ReporteVentasApp onNavigate={handleNavigate} />
          )}
          {cleanPath === '/reports/comparison' && (
            <ComparativaSucursalesApp onNavigate={handleNavigate} />
          )}
          {cleanPath === '/reports/top-dishes' && <PlatillosMasVendidosApp />}
          {cleanPath === '/reports/peak-hours' && <HorariosDemandaApp />}
          {cleanPath === '/reports/performance' && <SucursalesAtencionApp />}
        </>
      )}

      {/* Rutas delegadas a CompanionApp */}
      {isCompanionPath(cleanPath) && (
        <CompanionApp
          key={`${cleanPath}#${navNonce}`}
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