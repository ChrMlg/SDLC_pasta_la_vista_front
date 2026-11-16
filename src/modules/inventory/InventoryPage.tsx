import { useCallback, useEffect, useRef, useState } from 'react';
import './inventory.css';
import { getBranches, getInventory, type ApiError, type Branch, type InventoryItem } from './inventory-api';
import { InventoryTable } from './InventoryTable';
import { MovementForm } from './MovementForm';

type ManagementRole = 'MANAGER' | 'GENERAL_MANAGER';

function errorMessage(error: unknown): string {
  const status = (error as Partial<ApiError> | null)?.status;
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver esta pantalla.';
  if (status === 404) return 'No tiene acceso a esta sucursal.';
  return 'No se pudo cargar el inventario. Intente de nuevo.';
}

function PermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function InventoryPage({ role, branchId: sessionBranchId }: {
  role: ManagementRole;
  branchId: string | null;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesReady, setBranchesReady] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const [branchId, setBranchId] = useState(role === 'MANAGER' ? sessionBranchId ?? '' : '');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const requestId = useRef(0);
  const branchName = branches.find(branch => branch.id === branchId)?.name ?? '';

  const loadInventory = useCallback(async (targetBranchId = branchId) => {
    if (!targetBranchId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const request = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await getInventory(targetBranchId);
      if (request === requestId.current) setItems(result);
    } catch (cause: unknown) {
      if (request === requestId.current) {
        setItems([]);
        setError(errorMessage(cause));
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    const controller = new AbortController();
    setBranchesReady(false);
    setLoading(true);
    setError('');
    getBranches(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setBranches(result);
      setBranchesError(false);
      if (role === 'MANAGER') {
        setBranchId(sessionBranchId ?? '');
      } else {
        setBranchId(current => result.some(branch => branch.id === current) ? current : result[0]?.id ?? '');
      }
      setBranchesReady(true);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setBranchesReady(true);
      setBranchesError(true);
      setLoading(false);
      setError(errorMessage(cause));
    });
    return () => controller.abort();
  }, [role, sessionBranchId, branchesRetry]);

  useEffect(() => {
    if (!branchesReady) return;
    if (!branchId) {
      setItems([]);
      setLoading(false);
      return;
    }
    void loadInventory(branchId);
    return () => { requestId.current += 1; };
  }, [branchesReady, branchId, loadInventory]);

  async function reload() {
    setRefreshKey(value => value + 1);
    await loadInventory();
  }

  if (role !== 'MANAGER' && role !== 'GENERAL_MANAGER') return <PermissionError />;

  return <main className="shell inventoryPage">
    <header className="inventoryHeader">
      <span className="eyebrow">INVENTARIO</span>
      <h1>Inventario de insumos</h1>
      <p>Consulta las existencias de tu sucursal.</p>
    </header>

    <form className="inventoryFilters" onSubmit={event => {
      event.preventDefault();
      void reload();
    }}>
      {role === 'GENERAL_MANAGER'
        ? <label>Sucursal<select value={branchId} disabled={!branchesReady || loading || branches.length === 0}
          onChange={event => setBranchId(event.target.value)} required>
          {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
        </select></label>
        : <div className="inventoryBranch"><span>Sucursal</span><strong>
          {branchName || (loading ? 'Cargando…' : 'No disponible')}
        </strong></div>}
      <button type="submit" disabled={!branchesReady || loading || !branchId}>Actualizar</button>
    </form>

    {loading && <p role="status">Cargando inventario…</p>}
    {error && <div className="inventoryError">
      <p role="alert" className="error">{error}</p>
      <button type="button" onClick={() => {
        if (branchesError) setBranchesRetry(value => value + 1);
        else void reload();
      }} disabled={loading}>Reintentar</button>
    </div>}
    {!loading && !error && branchId && items.length === 0
      && <p className="inventoryEmpty">No hay insumos registrados para esta sucursal.</p>}

    <MovementForm branchId={branchId} items={items} onSaved={reload} />
    {!loading && !error && items.length > 0 && <InventoryTable items={items} />}

    {/* H15: alertas de reabastecimiento (aquí se agrega AlertsPanel) */}
  </main>;
}
