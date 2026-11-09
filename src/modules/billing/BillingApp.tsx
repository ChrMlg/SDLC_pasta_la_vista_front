import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MenuSession } from '../menu/MenuApp';
import { BillingRequestError, request } from './billing-api';
import './billing.css';

type Table = { id: string; number: number; status: string };
type Bill = {
  id: string;
  branchId: string;
  tableId: string | null;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  orderIds: string[];
  payments?: { id: string; status: string; cardLast4: string }[];
};
type Summary = {
  canClose: boolean;
  blockingOrderIds: string[];
  orders: {
    id: string;
    orderNumber: number;
    status: string;
    items: { name: string; quantity: number; unitPrice: string; lineTotal: string }[];
  }[];
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
};
type ReceiptSnapshot = {
  branchName?: string;
  tableNumber?: number | null;
  items: { orderNumber?: number; name: string; quantity: number; unitPrice: string; lineTotal: string }[];
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
};
type Receipt = {
  id: string;
  branchId: string;
  number: string;
  cardLast4: string;
  snapshot: ReceiptSnapshot;
  createdAt: string;
  issuedAt?: string;
  branchName?: string | null;
  total?: string;
};
type BillingNavigationState = {
  summary?: Summary;
  tableNumber?: number;
  receiptId?: string;
  paymentApproved?: boolean;
  accountClosed?: boolean;
};

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof BillingRequestError) {
    if (error.failure.status === 401) return 'Inicia sesión para continuar';
    if (error.failure.status === 403) return 'No tienes permiso para realizar esta acción';
    if (error.failure.status === 404) return 'No se encontró la cuenta o mesa solicitada';
    if (error.failure.code === 'BILL_HAS_UNDELIVERED_ITEMS') return 'Hay pedidos sin entregar';
    return error.failure.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

const orderStatusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const Amounts = ({ data }: { data: Pick<Bill, 'subtotal' | 'discount' | 'tax' | 'total'> }) =>
  <dl className="billingAmounts">
    <dt>Subtotal</dt><dd>${data.subtotal}</dd>
    <dt>Descuento</dt><dd>${data.discount}</dd>
    <dt>IVA (13 %)</dt><dd>${data.tax}</dd>
    <dt>Total</dt><dd><strong>${data.total}</strong></dd>
  </dl>;

function BillingTableSummary({ branchId, tableId, tableNumber }: { branchId: string; tableId: string; tableNumber: number }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSummary(null);
    setError('');
    request<Summary>(`/branches/${encodeURIComponent(branchId)}/tables/${encodeURIComponent(tableId)}/billing-summary`)
      .then(data => { if (active) setSummary(data); })
      .catch(cause => { if (active) setError(failureMessage(cause, 'No se pudo cargar el consumo de la mesa')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, tableId]);

  async function closeBill() {
    if (!summary?.canClose || saving) return;
    setSaving(true);
    setError('');
    try {
      const bill = await request<Bill>(`/branches/${encodeURIComponent(branchId)}/bills`, {
        method: 'POST',
        body: JSON.stringify({ tableId }),
      });
      navigate(`/waiter/billing/${bill.id}`, { state: { summary, tableNumber, accountClosed: true } satisfies BillingNavigationState });
    } catch (cause) {
      setError(cause instanceof BillingRequestError && cause.failure.code === 'BILL_HAS_UNDELIVERED_ITEMS'
        ? 'Hay pedidos sin entregar'
        : 'No se pudo cerrar la cuenta');
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  }

  const blockingOrders = summary?.orders.filter(order => order.status !== 'DELIVERED') ?? [];

  return <section className="billingCard" aria-labelledby="billing-summary-title">
    <h2 id="billing-summary-title">Cuenta de la mesa {tableNumber}</h2>
    {loading && <p role="status">Cargando consumo...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {!loading && summary && summary.orders.length === 0 && <p>Esta mesa no tiene pedidos por cobrar</p>}
    {summary && summary.orders.length > 0 && <>
      <ul className="billingOrders">
        {summary.orders.map(order => <li key={order.id}>
          <strong>Pedido #{order.orderNumber}</strong>
          <span className="billingOrderStatus">{orderStatusLabel[order.status] ?? 'Estado desconocido'}</span>
          <ul>{order.items.map((item, index) => <li key={`${order.id}-${index}`}>
            {item.quantity} × {item.name} · ${item.unitPrice} · ${item.lineTotal}
          </li>)}</ul>
        </li>)}
      </ul>
      <Amounts data={summary} />
      {blockingOrders.length > 0 && <>
        <p role="status" className="billingWarning">Hay pedidos sin entregar</p>
        <ul className="billingBlockingOrders">
          {blockingOrders.map(order => <li key={order.id}>
            Pedido #{order.orderNumber} · {orderStatusLabel[order.status] ?? 'Estado desconocido'}
          </li>)}
        </ul>
      </>}
      <button type="button" disabled={!summary.canClose || saving} onClick={() => setConfirming(true)}>
        {saving ? 'Cerrando...' : 'Cerrar cuenta'}
      </button>
    </>}
    {confirming && <div className="billingModalBackdrop">
      <section className="billingModal" role="dialog" aria-modal="true" aria-labelledby="close-bill-title">
        <h2 id="close-bill-title">Confirmar cierre</h2>
        <p>¿Cerrar la cuenta de la mesa {tableNumber}?</p>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="billingActions">
          <button type="button" className="secondaryButton" disabled={saving} onClick={() => { setConfirming(false); setError(''); }}>Cancelar</button>
          <button type="button" disabled={saving || !summary?.canClose} onClick={closeBill}>
            {saving ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </section>
    </div>}
  </section>;
}

export function WaiterBilling({ session }: { session: MenuSession }) {
  const branchId = session.branchId ?? '';
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTableId = searchParams.get('tableId') ?? '';
  const occupiedTables = tables.filter(table => table.status === 'OCCUPIED');
  const selectedTable = occupiedTables.find(table => table.id === selectedTableId);

  useEffect(() => {
    if (session.role !== 'WAITER' || !branchId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    request<Table[]>(`/branches/${encodeURIComponent(branchId)}/tables`)
      .then(data => { if (active) setTables(data); })
      .catch(cause => { if (active) setError(failureMessage(cause, 'No se pudieron cargar las mesas')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, session.role]);

  if (session.role !== 'WAITER' || !branchId) return <main className="shell"><p role="alert">No tienes permiso para cerrar cuentas en esta sucursal</p></main>;

  function chooseTable(tableId: string) {
    const next = new URLSearchParams(searchParams);
    if (tableId) next.set('tableId', tableId);
    else next.delete('tableId');
    setSearchParams(next);
  }

  return <main className="shell billingPage">
    <p className="eyebrow">MÓDULO 6 · MESERO</p>
    <h1>Cerrar cuenta</h1>
    <section className="billingCard">
      <label className="billingSelectLabel">Seleccionar mesa ocupada
        <select value={selectedTableId} onChange={event => chooseTable(event.target.value)} disabled={loading}>
          <option value="">Selecciona una mesa</option>
          {occupiedTables.map(table => <option key={table.id} value={table.id}>Mesa {table.number}</option>)}
        </select>
      </label>
      {loading && <p role="status">Cargando mesas...</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {!loading && !error && occupiedTables.length === 0 && <p>No hay mesas ocupadas</p>}
    </section>
    {selectedTable && <BillingTableSummary key={selectedTable.id} branchId={branchId} tableId={selectedTable.id} tableNumber={selectedTable.number} />}
  </main>;
}

export function WaiterBillDetail({ session }: { session: MenuSession }) {
  const { billId = '' } = useParams();
  const location = useLocation();
  const state = location.state as BillingNavigationState | null;
  const [bill, setBill] = useState<Bill | null>(null);
  const [tableNumber, setTableNumber] = useState<number | undefined>(state?.tableNumber);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session.role !== 'WAITER' || !session.branchId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    request<Bill>(`/bills/${encodeURIComponent(billId)}`)
      .then(async data => {
        if (!active) return;
        setBill(data);
        if (data.tableId && tableNumber === undefined) {
          const tables = await request<Table[]>(`/branches/${encodeURIComponent(session.branchId!)}/tables`);
          const table = tables.find(candidate => candidate.id === data.tableId);
          if (active) setTableNumber(table?.number);
        }
      })
      .catch(cause => { if (active) setError(failureMessage(cause, 'No se pudo cargar la cuenta')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [billId, session.branchId, session.role, tableNumber]);

  if (session.role !== 'WAITER' || !session.branchId) return <main className="shell"><p role="alert">No tienes permiso para consultar esta cuenta</p></main>;

  return <main className="shell billingPage">
    <p className="eyebrow">MÓDULO 6 · MESERO</p>
    <h1>{tableNumber !== undefined ? `Cuenta de la mesa ${tableNumber}` : 'Cuenta'}</h1>
    {loading && <p role="status">Cargando cuenta...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {state?.accountClosed && <p role="status" className="notice">Cuenta cerrada</p>}
    {state?.paymentApproved && <p role="status" className="notice">Pago aprobado</p>}
    {state?.summary && <div className="billingCard">
      <h2>Consumo</h2>
      <ul className="billingOrders">{state.summary.orders.map(order => <li key={order.id}>
        <strong>Pedido #{order.orderNumber}</strong>
        <ul>{order.items.map((item, index) => <li key={`${order.id}-${index}`}>
          {item.quantity} × {item.name} · ${item.unitPrice} · ${item.lineTotal}
        </li>)}</ul>
      </li>)}</ul>
    </div>}
    {bill && <>
      <section className="billingCard">
        <p>Estado: <strong>{bill.status}</strong></p>
        <Amounts data={bill} />
        {bill.status === 'OPEN' && <Link className="billingButton"
          to={`/checkout?billId=${encodeURIComponent(bill.id)}`}
          state={{ summary: state?.summary, tableNumber: tableNumber ?? state?.tableNumber }}>
          Cobrar
        </Link>}
        {bill.status === 'PAID' && state?.receiptId && <>
          <div className="billingActions">
            <Link to={`/branches/${bill.branchId}/receipts/${state.receiptId}`}>Ver comprobante</Link>
            <a href={`/api/branches/${encodeURIComponent(bill.branchId)}/receipts/${encodeURIComponent(state.receiptId)}/pdf`} download>
              Descargar PDF
            </a>
          </div>
        </>}
        {bill.status === 'PAID' && !state?.receiptId && <p role="status">La cuenta está pagada.</p>}
      </section>
    </>}
    <Link to="/waiter/billing">Volver a cuentas</Link>
  </main>;
}

export function TableBilling({ session }: { session: MenuSession }) {
  const { branchId = '', tableId = '' } = useParams();
  if (session.role !== 'WAITER' || session.branchId !== branchId)
    return <main className="shell"><p role="alert">No tienes permiso para cerrar cuentas en esta sucursal</p></main>;
  return <Navigate to={`/waiter/billing?tableId=${encodeURIComponent(tableId)}`} replace />;
}

export function TakeawayBilling({ session }: { session: MenuSession }) {
  const { branchId = '', orderId = '' } = useParams();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  if (!['CUSTOMER', 'WAITER'].includes(session.role)) return <main className="shell"><p role="alert">No tienes permiso para crear esta cuenta</p></main>;
  return <main className="shell billingPage"><h1>Cuenta para llevar</h1>
    {error && <p role="alert" className="error">{error}</p>}
    {!bill && <button disabled={saving} onClick={async () => {
      setSaving(true);
      setError('');
      try {
        setBill(await request<Bill>(`/branches/${encodeURIComponent(branchId)}/bills`, {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        }));
      } catch (cause) {
        setError(failureMessage(cause, 'No se pudo crear la cuenta'));
      } finally {
        setSaving(false);
      }
    }}>{saving ? 'Creando...' : 'Crear cuenta'}</button>}
    {bill && <p role="status">Cuenta creada. <Link to={`/checkout?billId=${encodeURIComponent(bill.id)}`}>Cobrar</Link></p>}
  </main>;
}

export function ReceiptList() {
  const [result, setResult] = useState<{ data: Receipt[]; total: number; page: number; pageSize: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request<{ data: Receipt[]; total: number; page: number; pageSize: number }>(`/me/receipts?page=${page}`)
      .then(data => { if (active) setResult(data); })
      .catch(cause => { if (active) setError(failureMessage(cause, 'No se pudieron cargar los comprobantes')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  return <main className="shell billingPage">
    <p className="eyebrow">MÓDULO 6 · CLIENTE</p>
    <h1>Mis comprobantes</h1>
    {loading && <p role="status">Cargando comprobantes...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {!loading && !error && result?.data.length === 0 && <p>Aún no tienes comprobantes</p>}
    {!loading && !error && result && result.data.length > 0 && <>
      <ul className="receiptList">
        {result.data.map(receipt => <li key={receipt.id}>
          <Link to={`/my-receipts/${receipt.id}`}>{receipt.number}</Link>
          <span>{receipt.branchName ?? 'Sucursal'} · ${receipt.total ?? receipt.snapshot.total}</span>
        </li>)}
      </ul>
      <nav className="billingPagination" aria-label="Paginación de comprobantes">
        <button type="button" className="secondaryButton" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</button>
        <span>Página {page} de {pageCount}</span>
        <button type="button" className="secondaryButton" disabled={page >= pageCount} onClick={() => setPage(current => current + 1)}>Siguiente</button>
      </nav>
    </>}
  </main>;
}

export function ReceiptDetail({ mine }: { mine: boolean }) {
  const { branchId = '', receiptId = '' } = useParams();
  const [item, setItem] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const path = mine ? `/me/receipts/${encodeURIComponent(receiptId)}` : `/branches/${encodeURIComponent(branchId)}/receipts/${encodeURIComponent(receiptId)}`;
  const pdfPath = mine
    ? `/api/me/receipts/${encodeURIComponent(receiptId)}/pdf`
    : `/api/branches/${encodeURIComponent(branchId)}/receipts/${encodeURIComponent(receiptId)}/pdf`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request<Receipt>(path)
      .then(data => { if (active) setItem(data); })
      .catch(() => { if (active) setError(mine ? 'Comprobante no disponible' : 'No se pudo cargar el comprobante'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, mine]);

  return <main className="shell billingPage">
    <p className="eyebrow">MÓDULO 6</p>
    <h1>Comprobante</h1>
    {loading && <p role="status">Cargando comprobante...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {item && <section className="billingCard">
      <h2>{item.number}</h2>
      {item.snapshot.branchName && <p>{item.snapshot.branchName}</p>}
      {item.snapshot.tableNumber && <p>Mesa {item.snapshot.tableNumber}</p>}
      <p>Tarjeta **** {item.cardLast4}</p>
      <ul className="billingOrders">{item.snapshot.items.map((line, index) => <li key={`${line.orderNumber ?? 'order'}-${index}`}>
        {line.orderNumber ? `Pedido #${line.orderNumber} · ` : ''}{line.quantity} × {line.name} · ${line.unitPrice} · ${line.lineTotal}
      </li>)}</ul>
      <Amounts data={item.snapshot} />
      <a className="billingButton" href={pdfPath} download={`${item.number}.pdf`}>Descargar PDF</a>
    </section>}
    {mine && <Link to="/my-receipts">Volver a mis comprobantes</Link>}
  </main>;
}
