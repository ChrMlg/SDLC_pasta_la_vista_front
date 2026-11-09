import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, categories, labels, type ApiError, type Category, type MenuItem, type Page, type Values } from './api';
import { validateMenuForm } from './validation';
import { orderHandoff } from './handoff';
import './menu.css';
import { OrderForm } from '../orders/OrderForm';
import { ReceiptDetail, ReceiptList, TableBilling, TakeawayBilling, WaiterBilling, WaiterBillDetail } from '../billing/BillingApp';
import { CheckoutPago } from '../billing/CheckoutPago';
import { NotificationsInbox } from '../notifications/NotificationsInbox';
import { CustomerJourney } from '../orders/CustomerJourney';
import { OrdersBoard } from '../orders/OrdersBoard';

export type MenuSession = { role: 'CUSTOMER' | 'WAITER' | 'KITCHEN' | 'MANAGER' | 'GENERAL_MANAGER'; branchId: string | null };
export type MenuAppProps = { session: MenuSession | null; selectedBranchId?: string | null; onSelectBranch?: (branchId: string) => void; onLogout?: () => void; onAddDish?: (dishId: string, page?: number, search?: string, category?: string) => void };
const errorText = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  if (apiError?.status === 404) return 'No tiene acceso a esta sucursal';
  if (apiError?.status === 403) return 'No tiene permiso para administrar este menú';
  return apiError?.status ? apiError.message : fallback;
};

function MenuList({ branchId, admin, onAddDish }: { branchId: string; admin: boolean; onAddDish?: (dishId: string, page?: number, search?: string, category?: string) => void }) {
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [category, setCategory] = useState('');
  const [available, setAvailable] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(sessionStorage.getItem('menuNotice') ?? '');
  const [pending, setPending] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const availabilityBusy = useRef(false);
  useEffect(() => {
    if (!pending) return;
    const previous = triggerRef.current;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !availabilityBusy.current) { event.preventDefault(); setPending(null); }
      if (event.key === 'Tab' && dialog) {
        const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        if (!buttons.length) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0].focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [pending]);
  useEffect(() => { sessionStorage.removeItem('menuNotice'); }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page) });
    if (submitted) query.set('search', submitted);
    if (category) query.set('category', category);
    if (admin && available) query.set('isAvailable', available);
    setLoading(true); setError(''); setResult(null);
    api.list(branchId, query, admin).then(data => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(admin ? errorText(err, 'No se pudieron cargar los platillos') : ((err as ApiError)?.status === 403 || (err as ApiError)?.status === 404 ? 'No tiene acceso a esta sucursal' : 'No se pudo cargar el menú')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, admin, page, submitted, category, available, refresh]);
  async function changeAvailability() {
    if (!pending || availabilityBusy.current) return;
    availabilityBusy.current = true;
    setSaving(true); setError(''); setNotice('');
    try {
      const updated = await api.availability(branchId, pending.id, !pending.isAvailable);
      setResult(current => current && ({ ...current, data: current.data.map(item => item.id === pending.id ? { ...item, ...updated } : item) }));
      setNotice('Disponibilidad actualizada');
      setRefresh(value => value + 1);
    } catch (err) {
      if ((err as ApiError)?.status === 409) { setNotice('El platillo ya tiene ese estado'); setRefresh(value => value + 1); }
      else setError(errorText(err, 'No se pudo cambiar la disponibilidad'));
    } finally { availabilityBusy.current = false; setPending(null); setSaving(false); }
  }
  return <main className="shell">
    <header><h1>{admin ? 'Administrar platillos' : 'Menú digital'}</h1>{admin && <Link to="/management/menu/new">Nuevo platillo</Link>}</header>
    {notice && <p role="status" className="notice">{notice}</p>}
    <form className="filters" onSubmit={event => { event.preventDefault(); setSubmitted(search); setPage(1); }}>
      <label>Buscar platillo<input maxLength={80} value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label>Categoría<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">Todas</option>
        {categories.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
      {admin && <label>Disponibilidad<select value={available} onChange={event => { setAvailable(event.target.value); setPage(1); }}>
        <option value="">Todos</option><option value="true">Disponible</option><option value="false">No disponible</option></select></label>}
      <button type="submit">Buscar</button>
    </form>
    <button className="textButton" onClick={() => setRefresh(value => value + 1)}>Actualizar</button>
    {loading && <p role="status">{admin ? 'Cargando platillos...' : 'Cargando menú...'}</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {!loading && !error && result?.data.length === 0 && <p>{admin ? (submitted || category || available ? 'No hay platillos para este filtro' : 'No hay platillos registrados') : 'No hay platillos para esta búsqueda'}</p>}
    {!loading && result && admin && <div className="tableWrap"><table><thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Disponibilidad</th><th>Última actualización</th><th>Acciones</th></tr></thead>
      <tbody>{result.data.map(item => <tr key={item.id}><td data-label="Nombre">{item.name}</td><td data-label="Categoría">{labels[item.category]}</td><td data-label="Precio">${item.price}</td>
        <td data-label="Disponibilidad"><span className={item.isAvailable ? 'statusBadge' : 'statusBadge unavailable'}>{item.isAvailable ? 'Disponible' : 'No disponible'}</span></td><td data-label="Última actualización">{item.updatedAt ? new Date(item.updatedAt).toLocaleString('es-GT') : '—'}</td>
        <td data-label="Acciones"><div className="rowActions"><Link to={`/management/menu/${item.id}/edit`}>Editar</Link><button type="button" role="switch" aria-checked={item.isAvailable} aria-label={`Cambiar disponibilidad de ${item.name}`} className="availabilitySwitch" onClick={event => { triggerRef.current = event.currentTarget; setPending(item); }}><span aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
    {!loading && result && !admin && <div className="cards">{result.data.map(item => <article className="card" key={item.id}>
      <small>{labels[item.category]}</small><h2>{item.name}</h2>{item.description && <p>{item.description}</p>}
      <div className="cardBottom"><strong>USD ${item.price}</strong><span className={item.isAvailable ? 'statusBadge' : 'statusBadge unavailable'}>{item.isAvailable ? 'Disponible' : 'No disponible'}</span>
        <button aria-describedby={!item.isAvailable || !onAddDish ? `add-help-${item.id}` : undefined} disabled={!item.isAvailable || !onAddDish} onClick={() => onAddDish?.(item.id, page, submitted, category)}>Agregar</button></div>{(!item.isAvailable || !onAddDish) && <p id={`add-help-${item.id}`} className="addHelp">{!item.isAvailable ? 'Este platillo no está disponible para agregar.' : 'Seleccione una mesa para agregar platillos o use una cuenta de cliente o mesero.'}</p>}</article>)}</div>}
    {!loading && result && <nav className="pagination" aria-label="Páginas"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
      <span>Página {result.page} de {Math.max(1, Math.ceil(result.total / result.pageSize))} · {result.total} platillos</span><button disabled={page * result.pageSize >= result.total} onClick={() => setPage(p => p + 1)}>Siguiente</button></nav>}
    {pending && <div className="modalBackdrop"><div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="availability-title">
      <h2 id="availability-title">¿Confirmar cambio de disponibilidad?</h2><p>{pending.name}</p><div className="actions"><button disabled={saving} onClick={() => setPending(null)}>Cancelar</button><button disabled={saving} onClick={changeAvailability}>Confirmar</button></div>
    </div></div>}
  </main>;
}

const empty: Values = { name: '', description: '', category: '', price: '' };
function MenuForm({ branchId, id }: { branchId: string; id?: string }) {
  const navigate = useNavigate();
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    if (!id) return;
    setLoading(true); setLoadFailed(false); setError('');
    let active = true;
    api.get(branchId, id).then(item => { if (active) setValues({ name: item.name, description: item.description ?? '', category: item.category, price: item.price }); })
      .catch((err: unknown) => { if (active) { setError((err as ApiError)?.status === 404 ? 'Platillo no encontrado' : errorText(err, 'No se pudo cargar el platillo')); setLoadFailed(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [branchId, id]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const next = validateMenuForm(values); setErrors(next);
    if (Object.keys(next).length) { setError('Revise los datos del formulario'); return; }
    submitting.current = true; setSaving(true); setError('');
    try {
      if (id) await api.update(branchId, id, values); else await api.create(branchId, values);
      sessionStorage.setItem('menuNotice', id ? 'Platillo actualizado' : 'Platillo registrado');
      navigate('/management/menu');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError?.status === 409 && apiError.code === 'DUPLICATE_MENU_ITEM') {
        setErrors(current => ({ ...current, name: 'Ya existe un platillo con ese nombre en esta sucursal' }));
        setError('Revise los datos del formulario');
      } else {
        if (apiError?.field) setErrors(current => ({ ...current, [apiError.field!]: apiError.message }));
        setError(errorText(err, 'No se pudo guardar el platillo'));
      }
    } finally { submitting.current = false; setSaving(false); }
  }
  return <main className="shell"><Link to="/management/menu">← Volver</Link><h1>{id ? 'Editar platillo' : 'Nuevo platillo'}</h1>
    {loading ? <p role="status">Cargando platillo...</p> : loadFailed ? <p role="alert" className="error">{error}</p> : <form className="form" noValidate onSubmit={submit}>
      <label>Nombre<input maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} value={values.name} onChange={event => setValues({ ...values, name: event.target.value })} />{errors.name && <small id="name-error">{errors.name}</small>}</label>
      <label>Descripción<textarea maxLength={300} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} />{errors.description && <small id="description-error">{errors.description}</small>}</label>
      <label>Categoría<select value={values.category} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? "category-error" : undefined} onChange={event => setValues({ ...values, category: event.target.value as Category })}>
        <option value="">Seleccione</option>{categories.map(value => <option key={value} value={value}>{labels[value]}</option>)}
      </select>{errors.category && <small id="category-error">{errors.category}</small>}</label>
      <label>Precio (USD)<input inputMode="decimal" aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? "price-error" : undefined} value={values.price} onChange={event => setValues({ ...values, price: event.target.value })} />{errors.price && <small id="price-error">{errors.price}</small>}</label>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions"><Link to="/management/menu">Cancelar</Link><button type="submit" disabled={saving}>Guardar</button></div>
    </form>}</main>;
}
function EditRoute({ branchId }: { branchId: string }) { const { menuItemId } = useParams(); return <MenuForm branchId={branchId} id={menuItemId} />; }
function PublicRoute({ session, onAddDish }: { session: MenuSession; onAddDish?: MenuAppProps['onAddDish'] }) {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [seat, setSeat] = useState<{ branchId: string; tableId: string } | null>(null);
  const [seatLoading, setSeatLoading] = useState(session.role === 'CUSTOMER');
  const [seatError, setSeatError] = useState(false);
  useEffect(() => {
    if (session.role !== 'CUSTOMER') return;
    let active = true;
    setSeatLoading(true); setSeatError(false); setSeat(null);
    fetch('/api/me/table-selection', { credentials: 'include' }).then(response => {
      if (!response.ok) throw new Error('No se pudo consultar la mesa');
      return response.json() as Promise<{ branchId: string; tableId: string } | null>;
    }).then(value => { if (active) setSeat(value); }).catch(() => { if (active) setSeatError(true); })
      .finally(() => { if (active) setSeatLoading(false); });
    return () => { active = false; };
  }, [branchId, session.role]);
  if (session.role !== 'CUSTOMER' && session.role !== 'GENERAL_MANAGER' && session.branchId !== branchId)
    return <p role="alert">No tiene acceso a esta sucursal</p>;
  const canOrder = session.role === 'CUSTOMER' || session.role === 'WAITER';
  return <>{session.role === 'CUSTOMER' && (seatLoading ? <p role="status" className="shell">Consultando mesa...</p> : seatError ? <p role="alert" className="shell">No se pudo consultar su mesa. Actualice la página para intentar de nuevo.</p> : seat?.branchId !== branchId && <p className="shell">Para agregar platillos, <Link to={`/?branchId=${encodeURIComponent(branchId!)}`}>seleccione una mesa en esta sucursal</Link>.</p>)}
    <MenuList key={branchId} branchId={branchId!} admin={false} onAddDish={canOrder && (session.role !== 'CUSTOMER' || seat?.branchId === branchId) ? (dishId, page, search, category) => {
      if (onAddDish) { onAddDish(dishId, page, search, category); return; }
      navigate(orderHandoff(branchId!, dishId, page ?? 1, search, category, session.role === 'CUSTOMER' ? seat?.tableId : undefined));
    } : undefined} /></>;
}
function AppRoutes({ session, selectedBranchId, onAddDish }: MenuAppProps) {
  const adminBranch = session?.role === 'GENERAL_MANAGER' ? selectedBranchId : session?.branchId;
  const canManage = Boolean(session && ['MANAGER', 'GENERAL_MANAGER'].includes(session.role) && adminBranch);
  const [searchParams] = useSearchParams();
  const orderBranch = searchParams.get('branchId');
  return <Routes>
    <Route path="/" element={session?.role === 'CUSTOMER' ? <CustomerJourney /> : session?.role === 'MANAGER' || session?.role === 'GENERAL_MANAGER' ? <Navigate to="/management/menu" replace /> : session?.role === 'WAITER' || session?.role === 'KITCHEN' ? <Navigate to="/orders" replace /> : <main className="shell"><h1>Bienvenido a Bistro</h1><p>Seleccione una opción de navegación.</p></main>} />
    <Route path="/orders" element={session && ['WAITER', 'KITCHEN', 'MANAGER', 'GENERAL_MANAGER'].includes(session.role) ? <OrdersBoard session={session} /> : <p>Sin permiso</p>} />
    <Route path="/notifications" element={session && ['CUSTOMER', 'WAITER'].includes(session.role) ? <NotificationsInbox /> : <main className="shell"><p role="alert">No tiene permiso para ver las notificaciones.</p></main>} />
    <Route path="/management/menu" element={canManage ? <MenuList key={adminBranch!} branchId={adminBranch!} admin /> : <p>No tiene permiso para administrar este menú</p>} />
    <Route path="/management/menu/new" element={canManage ? <MenuForm branchId={adminBranch!} /> : <p>No tiene permiso para administrar este menú</p>} />
    <Route path="/management/menu/:menuItemId/edit" element={canManage ? <EditRoute branchId={adminBranch!} /> : <p>No tiene permiso para administrar este menú</p>} />
    <Route path="/branches/:branchId/menu" element={session && ['CUSTOMER', 'WAITER', 'MANAGER', 'GENERAL_MANAGER'].includes(session.role) ? <PublicRoute session={session} onAddDish={onAddDish} /> : <p>No tiene acceso a esta sucursal</p>} />
    <Route path="/orders/new" element={session && orderBranch && ['CUSTOMER', 'WAITER'].includes(session.role) && (session.role === 'CUSTOMER' ? Boolean(searchParams.get('tableId')) : session.branchId === orderBranch) ? <OrderForm session={session} branchId={orderBranch} /> : <Navigate to="/" replace />} />
    <Route path="/waiter/billing" element={session ? <WaiterBilling session={session} /> : <p>Inicie sesión</p>} />
    <Route path="/waiter/billing/:billId" element={session ? <WaiterBillDetail session={session} /> : <p>Inicie sesión</p>} />
    <Route path="/branches/:branchId/tables/:tableId/billing" element={session ? <TableBilling session={session} /> : <p>Inicie sesión</p>} />
    <Route path="/branches/:branchId/orders/:orderId/billing" element={session ? <TakeawayBilling session={session} /> : <p>Inicie sesión</p>} />
    <Route path="/checkout" element={session ? <CheckoutPago session={session} /> : <p>Inicie sesión</p>} />
    <Route path="/bills/:billId" element={<LegacyCheckoutRedirect />} />
    <Route path="/my-receipts" element={session?.role === 'CUSTOMER' ? <ReceiptList /> : <p>Sin permiso</p>} />
    <Route path="/my-receipts/:receiptId" element={session?.role === 'CUSTOMER' ? <ReceiptDetail mine /> : <p>Sin permiso</p>} />
    <Route path="/me/receipts" element={<Navigate to="/my-receipts" replace />} />
    <Route path="/me/receipts/:receiptId" element={<LegacyReceiptRedirect />} />
    <Route path="/branches/:branchId/receipts/:receiptId" element={session && session.role !== 'CUSTOMER' ? <ReceiptDetail mine={false} /> : <p>Sin permiso</p>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
function LegacyCheckoutRedirect() {
  const { billId = '' } = useParams();
  return <Navigate to={`/checkout?billId=${encodeURIComponent(billId)}`} replace />;
}
function LegacyReceiptRedirect() {
  const { receiptId = '' } = useParams();
  return <Navigate to={`/my-receipts/${encodeURIComponent(receiptId)}`} replace />;
}
function Navigation({ session, selectedBranchId, onSelectBranch, onLogout }: MenuAppProps) {
  const navigate = useNavigate();
  const [branch, setBranch] = useState(selectedBranchId ?? '');
  useEffect(() => setBranch(selectedBranchId ?? ''), [selectedBranchId]);
  if (!session) return null;
  const canSelect = session.role === 'GENERAL_MANAGER';
  const activeBranch = canSelect ? selectedBranchId : session.branchId;
  return <nav className="topNav" aria-label="Navegación principal"><div className="navInner">
    <Link className="brand" to="/">Bistro<span>✦</span></Link><div className="navLinks"><Link to="/">Inicio</Link>
    {activeBranch && session.role !== 'KITCHEN' && <Link to={`/branches/${activeBranch}/menu`}>Menú</Link>}
    {['WAITER', 'KITCHEN', 'MANAGER', 'GENERAL_MANAGER'].includes(session.role) && <Link to="/orders">Pedidos</Link>}
    {session.role === 'WAITER' && <Link to="/waiter/billing">Cerrar cuentas</Link>}
    {['MANAGER', 'GENERAL_MANAGER'].includes(session.role) && <Link to="/management/menu">Administrar menú</Link>}
    {session.role === 'CUSTOMER' && <Link to="/my-receipts">Mis comprobantes</Link>}
    {['CUSTOMER', 'WAITER'].includes(session.role) && <Link to="/notifications">Notificaciones</Link>}
    {canSelect && <form onSubmit={event => { event.preventDefault(); if (/^[0-9a-f-]{36}$/i.test(branch)) { onSelectBranch?.(branch); navigate(`/branches/${branch}/menu`); } }}>
      <label>Sucursal (ID) <input aria-label="ID de sucursal" value={branch} onChange={event => setBranch(event.target.value)} placeholder="UUID de sucursal" required /></label>
      <button type="submit">Abrir</button>
    </form>}
    <button className="navLogout" type="button" onClick={onLogout}>Cerrar sesión</button></div></div>
  </nav>;
}
export function MenuApp(props: MenuAppProps) { return <BrowserRouter><Navigation {...props} /><AppRoutes {...props} /></BrowserRouter>; }
