import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, labels, type MenuItem, type Page } from '../menu/api';
import { staleSeatDestination, type CurrentSeat } from './seat-navigation';

type Branch = { id: string; code: string; name: string };
type Table = { id: string; number: number; status: string; mine: boolean };
type ActiveSeat = CurrentSeat;

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new Error('No se pudieron cargar las opciones');
  return response.json() as Promise<T>;
}

export function CustomerJourney() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const branchId = params.get('branchId');
  const tableId = params.get('tableId');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeSeat, setActiveSeat] = useState<ActiveSeat | null>(null);
  const [menu, setMenu] = useState<Page | null>(null);
  const [page, setPage] = useState(1);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingSelection, setLoadingSelection] = useState(true);
  const [loadingTables, setLoadingTables] = useState(Boolean(branchId));
  const [loadingMenu, setLoadingMenu] = useState(Boolean(branchId && tableId));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true; setLoadingBranches(true); setError('');
    get<Branch[]>('/api/branches').then(data => { if (active) setBranches(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoadingBranches(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    get<ActiveSeat | null>('/api/me/table-selection')
      .then(data => { if (active) setActiveSeat(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoadingSelection(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (loadingSelection || !tableId) return;
    const destination = staleSeatDestination(branchId, tableId, activeSeat);
    if (destination) navigate(destination, { replace: true });
  }, [loadingSelection, activeSeat, branchId, tableId, navigate]);
  useEffect(() => {
    if (!branchId) return;
    let active = true; setLoadingTables(true); setError('');
    get<Table[]>(`/api/branches/${encodeURIComponent(branchId)}/tables`)
      .then(data => { if (active) setTables(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoadingTables(false); });
    return () => { active = false; };
  }, [branchId]);
  useEffect(() => {
    if (!branchId || !tableId) return;
    let active = true; setLoadingMenu(true); setError(''); setMenu(null);
    api.list(branchId, new URLSearchParams({ page: String(page) }), false)
      .then(data => { if (active) setMenu(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoadingMenu(false); });
    return () => { active = false; };
  }, [branchId, tableId, page]);

  async function selectSeat(table: Table) {
    if (!branchId || busy) return;
    setBusy(table.id); setError('');
    try {
      const response = await fetch(`/api/branches/${encodeURIComponent(branchId)}/tables/${encodeURIComponent(table.id)}/select`,
        { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'No se pudo elegir la mesa');
      }
      setActiveSeat({ branchId, tableId: table.id, number: table.number });
      navigate(`/?branchId=${encodeURIComponent(branchId)}&tableId=${encodeURIComponent(table.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo elegir la mesa');
      get<Table[]>(`/api/branches/${encodeURIComponent(branchId)}/tables`).then(setTables).catch(() => {});
      get<ActiveSeat | null>('/api/me/table-selection').then(setActiveSeat).catch(() => {});
    } finally { setBusy(null); }
  }

  async function releaseSeat(target: ActiveSeat) {
    if (busy) return;
    setBusy(target.tableId); setError('');
    try {
      const response = await fetch(`/api/branches/${encodeURIComponent(target.branchId)}/tables/${encodeURIComponent(target.tableId)}/select`,
        { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'No se pudo liberar la mesa');
      }
      setMenu(null);
      setActiveSeat(null);
      navigate(branchId === target.branchId ? `/?branchId=${encodeURIComponent(target.branchId)}` : '/');
      setTables(current => current.map(item => item.id === target.tableId ? { ...item, status: 'AVAILABLE', mine: false } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo liberar la mesa'); }
    finally { setBusy(null); }
  }

  const branch = branches.find(item => item.id === branchId);
  const table = tables.find(item => item.id === tableId);
  const validSeat = Boolean(activeSeat && activeSeat.branchId === branchId && activeSeat.tableId === tableId);
  const loading = loadingBranches || loadingSelection || (Boolean(branchId) && loadingTables) || (Boolean(tableId) && loadingMenu);
  const addDish = (dish: MenuItem) => navigate(`/orders/new?branchId=${encodeURIComponent(branchId!)}&tableId=${encodeURIComponent(tableId!)}&dishId=${encodeURIComponent(dish.id)}&page=${page}`);

  return <main className="shell customerFlow">
    <div className="eyebrow">BISTRO · TU VISITA</div>
    <div className="flowHeader"><div><h1>{!branchId ? 'Elige tu ubicación' : !tableId ? 'Encuentra tu mesa' : '¿Qué se te antoja?'}</h1>
      <p>{!branchId ? 'Escoge la sucursal donde nos visitas.' : !tableId ? `Estás en ${branch?.name ?? 'tu sucursal'}. Elige un espacio disponible.` : `Mesa ${activeSeat?.number ?? table?.number ?? ''} · ${branch?.name ?? ''}`}</p></div>
      {branchId && <button className="secondaryButton" onClick={() => { setPage(1); navigate('/'); }}>Cambiar ubicación</button>}</div>
    <div className="steps"><span className="active">01 Ubicación</span><span className={branchId ? 'active' : ''}>02 Mesa</span><span className={validSeat ? 'active' : ''}>03 Menú</span></div>
    {activeSeat && (activeSeat.branchId !== branchId || activeSeat.tableId !== tableId) && <div className="activeSeatBanner">
      <div><strong>Ya tienes la mesa {activeSeat.number} asignada</strong><p>{branches.find(item => item.id === activeSeat.branchId)?.name ?? 'Tu sucursal'} · Continúa con su menú o libera la mesa para elegir otra.</p></div>
      <div className="seatActions"><button onClick={() => navigate(`/?branchId=${encodeURIComponent(activeSeat.branchId)}&tableId=${encodeURIComponent(activeSeat.tableId)}`)}>Continuar al menú</button>
      <button className="secondaryButton" disabled={busy !== null} onClick={() => void releaseSeat(activeSeat)}>Liberar mesa</button></div></div>}
    {error && <p role="alert" className="error">{error}</p>}
    {loading && <p role="status" className="loadingCard">Cargando opciones...</p>}
    {!branchId && !loading && <div className="choiceGrid">{branches.map(item => <button className="choiceCard" key={item.id} onClick={() => navigate(`/?branchId=${encodeURIComponent(item.id)}`)}>
      <span className="choiceIcon">⌖</span><span><strong>{item.name}</strong><small>{item.code}</small></span><span aria-hidden="true">→</span></button>)}
      {branches.length === 0 && <p>Aún no hay ubicaciones disponibles.</p>}</div>}
    {branchId && !tableId && !loading && <div className="choiceGrid">{tables.map(item => <button className="choiceCard" key={item.id}
      disabled={busy !== null || (activeSeat !== null && activeSeat.tableId !== item.id) || (item.status !== 'AVAILABLE' && !item.mine)} onClick={() => selectSeat(item)}>
      <span className="choiceIcon">{String(item.number).padStart(2, '0')}</span><span><strong>Mesa {item.number}</strong><small>{item.mine ? 'Tu mesa' : item.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}</small></span><span aria-hidden="true">→</span></button>)}
      {tables.length === 0 && <p>No hay mesas configuradas en esta sucursal.</p>}</div>}
    {branchId && tableId && !loading && !validSeat && <p role="status" className="loadingCard">Actualizando tu mesa...</p>}
    {branchId && tableId && validSeat && <section className="menuSection"><div className="sectionHeading"><div><span className="eyebrow">MENÚ DE LA CASA</span><h2>Platillos para disfrutar</h2></div>
      <div className="seatActions"><button className="secondaryButton" disabled={busy !== null} onClick={() => void releaseSeat(activeSeat!)}>{busy ? 'Liberando...' : 'Liberar mesa'}</button>
      <button className="secondaryButton" onClick={() => navigate(`/orders/new?branchId=${encodeURIComponent(branchId)}&tableId=${encodeURIComponent(tableId)}`)}>Ver pedido →</button></div></div>
      {menu?.data.length === 0 && <p>No hay platillos disponibles en este momento.</p>}
      <div className="dishGrid">{menu?.data.map(item => <article className="dishCard" key={item.id}><div className="dishArt" aria-hidden="true">✦</div><div className="dishBody"><small>{labels[item.category]}</small><h3>{item.name}</h3><p>{item.description || 'Preparado con el sabor de la casa.'}</p><div className="dishFoot"><strong>${item.price}</strong><button disabled={!item.isAvailable} onClick={() => addDish(item)}>{item.isAvailable ? 'Agregar +' : 'No disponible'}</button></div></div></article>)}</div>
      {menu && menu.total > 10 && <nav className="pagination" aria-label="Páginas del menú"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page} de {Math.ceil(menu.total / 10)}</span><button disabled={page * 10 >= menu.total} onClick={() => setPage(value => value + 1)}>Siguiente</button></nav>}</section>}
  </main>;
}
