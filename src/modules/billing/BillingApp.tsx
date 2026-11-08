import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { MenuSession } from '../menu/MenuApp';

type Bill = { id: string; branchId: string; tableId: string | null; status: 'OPEN' | 'PAID'; subtotal: string; discount: string; tax: string; total: string; orderIds: string[] };
type Summary = { canClose: boolean; blockingOrderIds: string[]; orders: { id: string; orderNumber: number; status: string; items: { name: string; quantity: number; unitPrice: string; lineTotal: string }[] }[]; subtotal: string; discount: string; tax: string; total: string };
type Receipt = { id: string; branchId: string; number: string; cardLast4: string; snapshot: { items: { name: string; quantity: number; unitPrice: string; lineTotal: string }[]; subtotal: string; discount: string; tax: string; total: string }; createdAt: string };
const orderStatusLabel: Record<string, string> = {
  PENDING: 'Pendiente', IN_PREPARATION: 'En preparación', READY: 'Listo',
  OUT_FOR_DELIVERY: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'No se pudo completar la operación');
  return data as T;
}
const Amounts = ({ data }: { data: { subtotal: string; discount: string; tax: string; total: string } }) =>
  <dl><dt>Subtotal</dt><dd>${data.subtotal}</dd><dt>Descuento</dt><dd>${data.discount}</dd><dt>IVA (13 %)</dt><dd>${data.tax}</dd><dt>Total</dt><dd><strong>${data.total}</strong></dd></dl>;

export function TableBilling({ session }: { session: MenuSession }) {
  const { branchId = '', tableId = '' } = useParams();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setLoading(true); request<Summary>(`/branches/${branchId}/tables/${tableId}/billing-summary`)
    .then(data => { if (active) setSummary(data); }).catch(err => { if (active) setError(err.message); })
    .finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [branchId, tableId]);
  async function close() { setSaving(true); setError(''); try { setBill(await request<Bill>(`/branches/${branchId}/bills`, { method: 'POST', body: JSON.stringify({ tableId }) })); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cerrar la cuenta'); } finally { setSaving(false); } }
  if (session.role !== 'WAITER' && session.role !== 'MANAGER' && session.role !== 'GENERAL_MANAGER') return <p>Sin permiso</p>;
  return <main className="shell"><h1>Cuenta de mesa</h1>{loading && <p role="status">Cargando consumo...</p>}{error && <p role="alert" className="error">{error}</p>}
    {summary && <><ul>{summary.orders.map(order => <li key={order.id}>Pedido #{order.orderNumber} · {orderStatusLabel[order.status] ?? 'Estado desconocido'}<ul>{order.items.map((item, i) => <li key={i}>{item.quantity} × {item.name} · ${item.unitPrice} · ${item.lineTotal}</li>)}</ul></li>)}</ul>
      {summary.orders.length === 0 && <p>No hay pedidos pendientes de cuenta</p>}<Amounts data={summary} />
      {!summary.canClose && summary.blockingOrderIds.length > 0 && <p role="status">Hay pedidos aún no entregados; la cuenta no puede cerrarse.</p>}
      {!bill && <button disabled={!summary.canClose || saving} onClick={close}>{saving ? 'Cerrando...' : 'Cerrar cuenta'}</button>}</>}
    {bill && <p role="status">Cuenta creada. <Link to={`/bills/${bill.id}`}>Ver cuenta y cobrar</Link></p>}</main>;
}
export function TakeawayBilling({ session }: { session: MenuSession }) {
  const { branchId = '', orderId = '' } = useParams(); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [bill, setBill] = useState<Bill | null>(null);
  if (!['CUSTOMER', 'WAITER', 'MANAGER', 'GENERAL_MANAGER'].includes(session.role)) return <p>Sin permiso</p>;
  return <main className="shell"><h1>Cuenta para llevar</h1>{error && <p role="alert" className="error">{error}</p>}
    {!bill && <button disabled={saving} onClick={async () => { setSaving(true); setError(''); try { setBill(await request<Bill>(`/branches/${branchId}/bills`, { method: 'POST', body: JSON.stringify({ orderId }) })); }
      catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta'); } finally { setSaving(false); } }}>{saving ? 'Creando...' : 'Crear cuenta'}</button>}
    {bill && <p role="status">Cuenta creada. <Link to={`/bills/${bill.id}`}>Ver cuenta y pagar</Link></p>}</main>;
}
export function BillPayment({ session }: { session: MenuSession }) {
  const { billId = '' } = useParams(); const [bill, setBill] = useState<Bill | null>(null); const [card, setCard] = useState('');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [receiptId, setReceiptId] = useState('');
  useEffect(() => { let active = true; request<Bill>(`/bills/${billId}`).then(data => { if (active) setBill(data); }).catch(err => { if (active) setError(err.message); })
    .finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [billId]);
  async function pay(event: FormEvent) { event.preventDefault(); if (saving) return; setSaving(true); setError(''); const number = card; setCard('');
    try { const result = await request<{ status: string; failureCode: string | null; receiptId: string | null }>(`/bills/${billId}/payments`, {
      method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ cardNumber: number }) });
      if (result.status === 'APPROVED' && result.receiptId) { setReceiptId(result.receiptId); setBill(current => current ? { ...current, status: 'PAID' } : current); }
      else setError(result.failureCode === 'CARD_DECLINED' ? 'Tarjeta rechazada. Puede intentar de nuevo.' : 'No se pudo completar el pago. Puede intentar de nuevo.');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar el pago'); } finally { setSaving(false); } }
  return <main className="shell"><h1>Pago de cuenta</h1>{loading && <p role="status">Cargando cuenta...</p>}{error && <p role="alert" className="error">{error}</p>}
    {bill && <><Amounts data={bill} />{bill.status === 'OPEN' && ['CUSTOMER', 'WAITER', 'MANAGER', 'GENERAL_MANAGER'].includes(session.role) &&
      <form onSubmit={pay}><label>Tarjeta de prueba<input inputMode="numeric" autoComplete="off" value={card} onChange={event => setCard(event.target.value)} required /></label>
        <button disabled={saving}>{saving ? 'Procesando pago...' : 'Pagar'}</button></form>}
      {bill.status === 'PAID' && <p role="status">Cuenta pagada.</p>}
      {receiptId && <Link to={session.role === 'CUSTOMER' ? `/me/receipts/${receiptId}` : `/branches/${bill.branchId}/receipts/${receiptId}`}>Ver comprobante</Link>}</>}</main>;
}
export function ReceiptList() {
  const [items, setItems] = useState<Receipt[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { request<Receipt[]>('/me/receipts').then(setItems).catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <main className="shell"><h1>Mis comprobantes</h1>{loading && <p role="status">Cargando comprobantes...</p>}{error && <p role="alert" className="error">{error}</p>}
    {!loading && !error && items.length === 0 && <p>Aún no tiene comprobantes</p>}
    <ul>{items.map(item => <li key={item.id}><Link to={`/me/receipts/${item.id}`}>{item.number}</Link> · ${item.snapshot.total}</li>)}</ul></main>;
}
export function ReceiptDetail({ mine }: { mine: boolean }) {
  const { branchId = '', receiptId = '' } = useParams(); const [item, setItem] = useState<Receipt | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const path = mine ? `/me/receipts/${receiptId}` : `/branches/${branchId}/receipts/${receiptId}`;
  useEffect(() => { let active = true; request<Receipt>(path).then(data => { if (active) setItem(data); }).catch(err => { if (active) setError(err.message); })
    .finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [path]);
  return <main className="shell"><h1>Comprobante</h1>{loading && <p role="status">Cargando comprobante...</p>}{error && <p role="alert" className="error">{error}</p>}
    {item && <><h2>{item.number}</h2><p>Tarjeta **** {item.cardLast4}</p><ul>{item.snapshot.items.map((line, i) => <li key={i}>{line.quantity} × {line.name} · ${line.lineTotal}</li>)}</ul>
      <Amounts data={item.snapshot} /><a href={`/api${path}/pdf`} download={`${item.number}.pdf`}>Descargar PDF</a></>}</main>;
}
