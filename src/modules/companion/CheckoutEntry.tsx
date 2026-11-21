import { Navigate, useSearchParams } from 'react-router-dom';
import { BRANCH_MAP } from '../../shared/api-client';
import type { MenuSession } from '../menu/MenuApp';
import { CheckoutPago } from '../billing/CheckoutPago';

type CheckoutEntryProps = {
  session: MenuSession;
  routeParams?: any;
  onNavigate: (p: string) => void;
};

export function CheckoutEntry({ session, routeParams, onNavigate }: CheckoutEntryProps) {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get('billId');
  const orderId = searchParams.get('orderId');

  if (billId) {
    return <CheckoutPago session={session} />;
  }
  if (!billId && !orderId) {
    return <Navigate replace
      to={session.role === 'WAITER' ? '/waiter/billing' : '/my-receipts'} />;
  }

  const paramBranchId = searchParams.get('branchId');
  const matchedOrderBranch = routeParams?.order?.id === orderId
    ? routeParams?.order?.branchId
    : undefined;
  const selectedBranch = routeParams?.selectedBranch
    ? BRANCH_MAP[routeParams.selectedBranch]
    : undefined;
  const branchId = paramBranchId || matchedOrderBranch || selectedBranch;

  if (branchId && (session.role === 'CUSTOMER' || session.role === 'WAITER')) {
    return <Navigate replace
      to={`/branches/${encodeURIComponent(branchId)}/orders/${encodeURIComponent(orderId!)}/billing`} />;
  }

  return <main className="shell">
    <p role="alert" className="error">No se pudo identificar la sucursal del pedido.</p>
    <button type="button" onClick={() => onNavigate('/my-orders')}>
      Volver a mi pedido
    </button>
  </main>;
}
