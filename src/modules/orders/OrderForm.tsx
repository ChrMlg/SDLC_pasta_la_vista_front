import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api as menuApi, type MenuItem, type Page } from '../menu/api';
import type { MenuSession } from '../menu/MenuApp';
import './orders.css';

type Selection = { dish: MenuItem; quantity: number; note: string };
type CreatedOrder = { id: string; orderNumber: number; status: 'PENDING'; total: string; type: 'DINE_IN' | 'TAKEAWAY'; tableId: string | null };

export function OrderForm({ session, branchId }: { session: MenuSession; branchId: string }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [type, setType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState(params.get('tableId') ?? '');
  const [page, setPage] = useState(() => Math.max(1, Number(params.get('page')) || 1));
  const [menu, setMenu] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    menuApi.list(branchId, new URLSearchParams({ page: String(page), ...(params.get('search') ? { search: params.get('search')! } : {}), ...(params.get('category') ? { category: params.get('category')! } : {}) }), false)
      .then(data => { if (active) { setMenu(data); setError(''); } })
      .catch((err: { message?: string }) => { if (active) setError(err.message ?? 'No se pudo cargar el menú'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, page, params]);
  useEffect(() => {
    const id = params.get('dishId');
    const dish = menu?.data.find(item => item.id === id);
    if (dish?.isAvailable) setSelections(current => current.some(entry => entry.dish.id === id) ? current : [...current, { dish, quantity: 1, note: '' }]);
  }, [menu, params]);
  const add = (dish: MenuItem) => setSelections(current => current.some(entry => entry.dish.id === dish.id) ? current : [...current, { dish, quantity: 1, note: '' }]);
  const update = (id: string, patch: Partial<Selection>) => setSelections(current => current.map(entry => entry.dish.id === id ? { ...entry, ...patch } : entry));
  const subtotalCents = selections.reduce((sum, entry) => {
    const [whole, fraction = ''] = entry.dish.price.split('.');
    return sum + (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * entry.quantity;
  }, 0);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!selections.length || selections.some(entry => !Number.isSafeInteger(entry.quantity) || entry.quantity < 1)) { setError('Seleccione platillos y cantidades válidas'); return; }
    if (type === 'DINE_IN' && !tableId.trim()) { setError('Indique la mesa asignada'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch(session.role === 'WAITER' ? '/api/orders' : '/api/orders/customer', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, type, tableId: type === 'DINE_IN' ? tableId.trim() : null,
          items: selections.map(entry => ({ dishId: entry.dish.id, quantity: entry.quantity, note: entry.note || null })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'No se pudo registrar el pedido');
      setCreated(data as CreatedOrder);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar el pedido'); }
    finally { setSaving(false); }
  }
  if (created) return <main className="shell"><h1>Pedido #{created.orderNumber}</h1><p role="status">Pedido registrado · Pendiente</p>
    <p>Total: ${created.total}</p><p>{created.type === 'TAKEAWAY' ? 'Pendiente de pago. Se enviará a cocina al aprobarse el pago.' : 'Enviado a cocina. Se cobrará al cerrar la cuenta.'}</p>
    {created.type === 'TAKEAWAY' && <Link to={`/branches/${branchId}/orders/${created.id}/billing`}>Crear cuenta y pagar</Link>}
    {created.type === 'DINE_IN' && session.role === 'WAITER' && created.tableId && <Link to={`/branches/${branchId}/tables/${created.tableId}/billing`}>Ver consumo de la mesa</Link>}
    <button onClick={() => { setCreated(null); setSelections([]); navigate(`/orders/new?branchId=${branchId}${tableId ? `&tableId=${encodeURIComponent(tableId)}` : ''}`); }}>Nuevo pedido</button></main>;
  return <main className="shell"><Link to={session.role === 'CUSTOMER' ? `/?branchId=${branchId}&tableId=${tableId}` : `/branches/${branchId}/menu`}>← Volver al menú</Link><h1>Nuevo pedido</h1>
    <form className="orderForm" onSubmit={submit}>
      {session.role === 'WAITER' && <label>Modalidad<select value={type} onChange={event => setType(event.target.value as 'DINE_IN' | 'TAKEAWAY')}><option value="DINE_IN">En mesa</option><option value="TAKEAWAY">Para llevar</option></select></label>}
      {session.role === 'WAITER' && type === 'DINE_IN' && <label>ID de mesa asignada<input value={tableId} onChange={event => setTableId(event.target.value)} required /></label>}
      {session.role === 'CUSTOMER' && <p className="seatSummary">Pedido en tu mesa seleccionada</p>}
      <h2>Platillos</h2>{loading && <p role="status">Cargando menú...</p>}
      {!loading && menu?.data.length === 0 && <p>No hay platillos registrados</p>}
      {menu?.data.map(dish => <div className="orderDish" key={dish.id}><span>{dish.name} · ${dish.price} {dish.isAvailable ? '' : '· No disponible'}</span>
        <button type="button" disabled={!dish.isAvailable || selections.some(entry => entry.dish.id === dish.id)} onClick={() => add(dish)}>Agregar</button></div>)}
      {menu && <nav className="pagination"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page}</span>
        <button type="button" disabled={page * 10 >= menu.total} onClick={() => setPage(value => value + 1)}>Siguiente</button></nav>}
      <h2>Revisar pedido</h2>{selections.length === 0 && <p>Aún no hay platillos seleccionados</p>}
      {selections.map(entry => <div className="selectedDish" key={entry.dish.id}><strong>{entry.dish.name}</strong>
        <label>Cantidad<input type="number" min="1" step="1" value={entry.quantity} onChange={event => update(entry.dish.id, { quantity: Number(event.target.value) })} /></label>
        <label>Nota<textarea maxLength={500} value={entry.note} onChange={event => update(entry.dish.id, { note: event.target.value })} /></label>
        <button type="button" onClick={() => setSelections(current => current.filter(item => item.dish.id !== entry.dish.id))}>Quitar</button></div>)}
      <p><strong>Subtotal estimado: ${(subtotalCents / 100).toFixed(2)}</strong></p><small>El servidor confirmará el importe con el precio vigente.</small>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={saving || !selections.length}>{saving ? 'Registrando...' : 'Confirmar pedido'}</button>
    </form></main>;
}
