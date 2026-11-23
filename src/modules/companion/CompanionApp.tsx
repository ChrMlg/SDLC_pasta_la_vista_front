import { MemoryRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import type { SessionProfile } from '../../shared/api-client';
import type { MenuSession } from '../menu/MenuApp';
import { OrderForm } from '../orders/OrderForm';
import { CustomerJourney } from '../orders/CustomerJourney';
import { ReservationNew } from '../reservations/ReservationNew';
import { MyReservations } from '../reservations/MyReservations';
import { ReservationsManagement } from '../reservations/ReservationsManagement';
import { InventoryPage } from '../inventory/InventoryPage';
import { RatingsSummary } from '../reviews/RatingsSummary';
import { BranchReviews } from '../reviews/BranchReviews';
import { MyReviews } from '../reviews/MyReviews';
import { MyLoyalty } from '../loyalty/MyLoyalty';
import { LoyaltyRules } from '../loyalty/LoyaltyRules';
import { RedeemPoints } from '../loyalty/RedeemPoints';
import {
  ReceiptDetail,
  ReceiptList,
  TableBilling,
  TakeawayBilling,
  WaiterBilling,
  WaiterBillDetail,
} from '../billing/BillingApp';
import { CheckoutEntry } from './CheckoutEntry';
import { TableStatusApp } from './TableStatusApp';
import { toInnerPath } from './companion-routes';
import './companion-base.css';
import './companion.css';

type CompanionAppProps = {
  session: SessionProfile;
  path: string;
  routeParams?: any;
  onNavigate: (path: string, params?: any) => void;
};

function OrderRoute({ session }: { session: MenuSession }) {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get('branchId');
  const tableId = searchParams.get('tableId');
  if (!branchId || !tableId) return <Navigate to="/" replace />;
  return <OrderForm session={session} branchId={branchId} />;
}

function LegacyCheckoutRedirect() {
  const { billId = '' } = useParams();
  return <Navigate to={`/checkout?billId=${encodeURIComponent(billId)}`} replace />;
}

function LegacyReceiptRedirect() {
  const { receiptId = '' } = useParams();
  return <Navigate to={`/my-receipts/${encodeURIComponent(receiptId)}`} replace />;
}

export function CompanionApp({ session, path, routeParams, onNavigate }: CompanionAppProps) {
  const menuSession: MenuSession = {
    role: session.role,
    branchId: session.branchId ?? null,
  };
  const homePath =
    session.role === 'MANAGER' ? '/management/menu'
      : session.role === 'WAITER' ? '/waiter/orders/new'
        : session.role === 'CUSTOMER' ? '/branches/menu'
          : session.role === 'KITCHEN' ? '/kitchen'
            : '/reports/sales';

  function notAvailable() {
    return <main className="shell">
      <p>Pantalla no disponible</p>
      <button type="button" onClick={() => onNavigate(homePath)}>Volver al inicio</button>
    </main>;
  }

  return <div className="companion-root">
    <MemoryRouter initialEntries={[toInnerPath(path)]}>
      <Routes>
        <Route path="/" element={session.role === 'CUSTOMER'
          ? <CustomerJourney />
          : <main className="shell">
            <p>Selecciona una opción del menú</p>
            <button type="button" onClick={() => onNavigate(homePath)}>Volver al inicio</button>
          </main>} />
        <Route path="/orders/new" element={session.role === 'CUSTOMER'
          ? <OrderRoute session={menuSession} />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/reservations/new" element={session.role === 'CUSTOMER'
          ? <ReservationNew />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/my-reservations" element={<MyReservations role={session.role} />} />
        <Route path="/management/reservations" element={['MANAGER', 'GENERAL_MANAGER'].includes(session.role)
          ? <ReservationsManagement role={session.role === 'MANAGER' ? 'MANAGER' : 'GENERAL_MANAGER'}
            branchId={session.role === 'MANAGER' ? session.branchId ?? null : null} />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/management/inventory" element={['MANAGER', 'GENERAL_MANAGER'].includes(session.role)
          ? <InventoryPage role={session.role === 'MANAGER' ? 'MANAGER' : 'GENERAL_MANAGER'}
            branchId={session.role === 'MANAGER' ? session.branchId ?? null : null} />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/management/ratings" element={['MANAGER', 'GENERAL_MANAGER'].includes(session.role)
          ? <RatingsSummary role={session.role === 'MANAGER' ? 'MANAGER' : 'GENERAL_MANAGER'}
            branchId={session.role === 'MANAGER' ? session.branchId ?? null : null} />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/reviews" element={<BranchReviews role={session.role} branchId={session.branchId ?? null} />} />
        <Route path="/my-reviews" element={session.role === 'CUSTOMER'
          ? <MyReviews />
          : <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>} />
        <Route path="/my-loyalty" element={<MyLoyalty role={session.role} />} />
        <Route path="/management/loyalty" element={<LoyaltyRules role={session.role} />} />
        <Route path="/loyalty/redeem" element={<RedeemPoints role={session.role} />} />
        <Route path="/waiter/billing" element={<WaiterBilling session={menuSession} />} />
        <Route path="/waiter/billing/:billId" element={<WaiterBillDetail session={menuSession} />} />
        <Route path="/table-status" element={['WAITER', 'MANAGER'].includes(session.role)
          ? <TableStatusApp branchId={session.branchId} />
          : <main className="shell"><p role="alert" className="error">No tienes permiso para consultar las mesas de esta sucursal.</p></main>} />
        <Route path="/branches/:branchId/tables/:tableId/billing" element={<TableBilling session={menuSession} />} />
        <Route path="/branches/:branchId/orders/:orderId/billing" element={<TakeawayBilling session={menuSession} />} />
        <Route path="/my-receipts" element={session.role === 'CUSTOMER'
          ? <ReceiptList />
          : <main className="shell"><p>Sin permiso</p></main>} />
        <Route path="/my-receipts/:receiptId" element={session.role === 'CUSTOMER'
          ? <ReceiptDetail mine />
          : <main className="shell"><p>Sin permiso</p></main>} />
        <Route path="/branches/:branchId/receipts/:receiptId" element={session.role !== 'CUSTOMER'
          ? <ReceiptDetail mine={false} />
          : <main className="shell"><p>Sin permiso</p></main>} />
        <Route path="/bills/:billId" element={<LegacyCheckoutRedirect />} />
        <Route path="/me/receipts" element={<Navigate to="/my-receipts" replace />} />
        <Route path="/me/receipts/:receiptId" element={<LegacyReceiptRedirect />} />
        <Route path="/checkout" element={<CheckoutEntry session={menuSession} routeParams={routeParams} onNavigate={onNavigate} />} />
        <Route path="*" element={notAvailable()} />
      </Routes>
    </MemoryRouter>
  </div>;
}
