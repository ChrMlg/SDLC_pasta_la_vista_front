import { useCallback, useEffect, useState } from 'react';
import type { MenuSession } from '../menu/MenuApp';

type TrackedOrder = { id: string; orderNumber: number; branchId: string; branchName: string; tableNumber: number | null;
  type: 'DINE_IN' | 'TAKEAWAY'; status: string; ticketStatus: string | null; total: string; createdAt: string;
  items: { id: string; name: string; quantity: number; note: string | null }[] };
const labels: Record<string, string> = { PENDING: 'Pendiente', IN_PREPARATION: 'En preparación', READY: 'Listo para entregar', DELIVERED: 'Entregado', CANCELLED: 'Cancelado' };

export function OrdersBoard({ session }: { session: MenuSession }) {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [branchName, setBranchName] = useState('');
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/orders', { credentials: 'include' });
      if (!response.ok) throw new Error('No se pudieron cargar los pedidos');
      setOrders(await response.json() as TrackedOrder[]);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Error al cargar pedidos'); }
    finally { if (!silent) setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(true); }, 10_000);
    const onVisible = () => { if (!document.hidden) void refresh(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);
  useEffect(() => {
    if (!session.branchId) return;
    fetch('/api/branches', { credentials: 'include' }).then(response => response.ok ? response.json() : [])
      .then((branches: { id: string; name: string }[]) => setBranchName(branches.find(branch => branch.id === session.branchId)?.name ?? ''))
      .catch(() => {});
  }, [session.branchId]);
  async function change(order: TrackedOrder, status: string) {
    setBusy(order.id); setError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status/${status}`, { method: 'PATCH', credentials: 'include' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'No se pudo actualizar el pedido');
      }
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el pedido'); }
    finally { setBusy(null); }
  }
  const next = (order: TrackedOrder) => session.role === 'KITCHEN' ?
    order.status === 'PENDING' ? ['IN_PREPARATION', 'Iniciar preparación'] :
    order.status === 'IN_PREPARATION' ? ['READY', 'Marcar listo'] : null :
    session.role === 'WAITER' && order.status === 'READY' ? ['DELIVERED', 'Marcar entregado'] : null;
  return <main className="shell"><div className="flowHeader"><div><div className="eyebrow">OPERACIÓN · BISTRO</div>
    <h1>{session.role === 'KITCHEN' ? 'Comandas de cocina' : 'Pedidos de la sucursal'}</h1>
    <p>{branchName || (session.role === 'GENERAL_MANAGER' ? 'Todas las sucursales' : 'Tu sucursal')} · {session.role === 'KITCHEN' ? 'Comandas enviadas a cocina.' : 'Pedidos registrados en esta sucursal.'}</p></div>
    <button className="secondaryButton" onClick={() => void refresh()} disabled={loading}>Actualizar</button></div>
    {loading && <p role="status">Cargando pedidos...</p>}{error && <p role="alert" className="error">{error}</p>}
    {!loading && orders.length === 0 && <p className="loadingCard">{session.role === 'KITCHEN' ? 'No hay comandas en esta sucursal. Los pedidos para llevar llegan a cocina tras aprobarse el pago.' : 'Aún no hay pedidos en esta sucursal.'}</p>}
    {session.role === 'WAITER' && orders.some(order => order.status === 'PENDING' || order.status === 'IN_PREPARATION') && <p className="awaitingSummary" role="status">{orders.filter(order => order.status === 'PENDING' || order.status === 'IN_PREPARATION').length} pedido(s) pendientes de cocina o pago</p>}
    <div className="orderGrid">{orders.map(order => { const action = next(order); const awaiting = session.role === 'WAITER' && (order.status === 'PENDING' || order.status === 'IN_PREPARATION'); return <article className={`trackedOrder${awaiting ? ' awaitingOrder' : ''}`} key={order.id}>
      <div className="trackedTop"><div><small>{session.role === 'GENERAL_MANAGER' ? `${order.branchName} · ` : ''}{order.type === 'DINE_IN' ? `Mesa ${order.tableNumber ?? '—'}` : 'Para llevar'} · {new Date(order.createdAt).toLocaleString('es-GT')}</small>
        <h2>Pedido #{order.orderNumber}</h2></div><span className={`statusBadge${awaiting ? ' awaitingBadge' : ''}`}>{order.status === 'PENDING' && !order.ticketStatus ? 'Pendiente de pago' : labels[order.status] ?? order.status}</span></div>
      <ul>{order.items.map(item => <li key={item.id}>{item.quantity} × {item.name}{item.note && <small> · {item.note}</small>}</li>)}</ul>
      <div className="trackedFoot"><strong>Total ${order.total}</strong>{action && <button disabled={busy !== null} onClick={() => void change(order, action[0])}>{busy === order.id ? 'Guardando...' : action[1]}</button>}</div>
    </article>; })}</div>
  </main>;
}
