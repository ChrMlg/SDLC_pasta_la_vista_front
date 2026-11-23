import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../../shared/api-client';
import {
  BLOCKED_TABLE_STATUSES,
  isOrderableTable,
  TABLE_STATUS_LABELS,
} from '../../shared/table-status';
import {
  fetchBranchTables,
  type BranchTableOption,
} from '../mesero/order/mesero-order-api';

interface EstadoMesasAppProps {
  branchId?: string | null;
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return 'Tu sesión ya no es válida. Inicia sesión de nuevo.';
    if (error.status === 403) return 'No tienes permiso para consultar las mesas de esta sucursal.';
    if (error.status === 404) return 'No se encontró la sucursal o sus mesas.';
    return `No se pudieron cargar las mesas (error ${error.status}).`;
  }
  return 'No se pudieron cargar las mesas. Verifica tu conexión e inténtalo de nuevo.';
}

export function EstadoMesasApp({ branchId }: EstadoMesasAppProps) {
  const [tables, setTables] = useState<BranchTableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTables = useCallback(async () => {
    if (!branchId) {
      setTables([]);
      setError('Tu usuario no tiene una sucursal asignada.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      setTables(await fetchBranchTables(branchId));
    } catch (loadError) {
      setTables([]);
      setError(getLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  return (
    <div className="companion-root">
      <main className="shell">
        <header className="flowHeader">
          <div>
            <span className="eyebrow">OPERACIÓN</span>
            <h1>Estado de mesas</h1>
            <p>Consulta el estado actual de las mesas de tu sucursal.</p>
          </div>
          <button
            type="button"
            className="secondaryButton"
            style={{ borderRadius: '999px' }}
            onClick={() => void loadTables()}
            disabled={loading || !branchId}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </header>

        <p className="notice">
          Para liberar una mesa por limpiar, contacta al encargado del sistema
        </p>

        {error && <p className="error" role="alert">{error}</p>}

        {loading && <p role="status">Cargando mesas…</p>}
        {!loading && !error && tables.length === 0 && (
          <p className="notice">No hay mesas registradas para esta sucursal.</p>
        )}
        {!loading && !error && tables.length > 0 && (
          <section className="cards" aria-label="Mesas de la sucursal">
            {tables.map((table) => {
              const status = table.status ?? '';
              const blocked = BLOCKED_TABLE_STATUSES.includes(status)
                || !isOrderableTable(status);
              const statusLabel = (TABLE_STATUS_LABELS[status] ?? status) || 'Estado desconocido';

              return (
                <article className="card" key={table.id}>
                  <div className="cardBottom">
                    <strong>{`Mesa ${String(table.number).padStart(2, '0')}`}</strong>
                    <span className={`statusBadge${blocked ? ' unavailable' : ''}`}>
                      {statusLabel}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
