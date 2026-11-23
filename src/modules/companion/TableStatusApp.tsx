import { useEffect, useState } from 'react';
import { ApiRequestError, apiRequest, extractArray } from '../../shared/api-client';
import {
  BLOCKED_TABLE_STATUSES,
  isOrderableTable,
  TABLE_STATUS_LABELS,
} from '../../shared/table-status';

type Table = { id: string; number: number; status: string };

export function TableStatusApp({ branchId }: { branchId?: string | null }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!branchId) {
      setTables([]);
      setError('No se encontró la sucursal de tu sesión.');
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError('');
    apiRequest<unknown>(`/branches/${encodeURIComponent(branchId)}/tables`)
      .then(data => {
        if (active) setTables(extractArray<Table>(data));
      })
      .catch(cause => {
        if (!active) return;
        setTables([]);
        if (cause instanceof ApiRequestError && cause.status === 403) {
          setError('No tienes permiso para consultar las mesas de esta sucursal.');
        } else if (cause instanceof ApiRequestError && cause.status === 404) {
          setError('No se encontró esta sucursal.');
        } else {
          setError('No se pudieron cargar las mesas. Verifica tu conexión e inténtalo de nuevo.');
        }
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [branchId]);

  return (
    <main className="shell">
      <p className="eyebrow">MESAS · SUCURSAL</p>
      <h1>Estado de mesas</h1>
      <p>Consulta el estado actual de las mesas de tu sucursal.</p>
      {loading && <p role="status">Cargando mesas...</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {!loading && !error && tables.length === 0 && <p>No hay mesas registradas en esta sucursal.</p>}
      {!loading && !error && tables.length > 0 && (
        <section className="billingCard" aria-label="Mesas de la sucursal">
          <ul className="billingOrders">
            {tables.map(table => {
              const status = table.status;
              const statusLabel = TABLE_STATUS_LABELS[status] ?? 'Estado desconocido';
              const marked = BLOCKED_TABLE_STATUSES.some(blockedStatus => blockedStatus === status);
              return (
                <li key={table.id}>
                  <strong>Mesa {String(table.number).padStart(2, '0')} · {statusLabel}</strong>
                  {isOrderableTable(status) && <span>Disponible para pedidos en mesa</span>}
                  {marked && <span>Requiere atención del encargado</span>}
                </li>
              );
            })}
          </ul>
          <p role="note">Para liberar una mesa por limpiar, contacta al encargado del sistema</p>
        </section>
      )}
    </main>
  );
}
