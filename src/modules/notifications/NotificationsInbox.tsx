import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type SourceModule = 'ORDERS' | 'RESERVATIONS' | 'KITCHEN';
type Notice = { id: string; title: string; message: string; sourceModule: SourceModule; createdAt: string; readAt: string | null };
type Page = { data: Notice[]; total: number; page: number; pageSize: number };
type ApiError = { code?: string; message?: string; field?: string | null };

const sourceModuleLabels: Record<SourceModule, string> = {
  ORDERS: 'Pedidos',
  RESERVATIONS: 'Reservaciones',
  KITCHEN: 'Cocina',
};

export function NotificationsInbox() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/notifications?page=${page}`, { credentials: 'include', signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as ApiError;
          const message = response.status === 401 ? 'Inicie sesión para ver las notificaciones.'
            : response.status === 403 ? 'No tiene permiso para ver las notificaciones.'
              : body.message ?? 'No se pudieron cargar las notificaciones.';
          throw new Error(message);
        }
        return response.json() as Promise<Page>;
      })
      .then(setResult)
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las notificaciones.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page]);
  return <main className="shell"><header><h1>Notificaciones</h1><Link to="/">Inicio</Link></header>
    {loading && <p role="status">Cargando notificaciones...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {!loading && !error && result?.data.length === 0 && <p>No hay notificaciones.</p>}
    {!loading && !error && result?.data.map(notice => <article className="card" key={notice.id}>
      <h2>{notice.title}</h2><p>{notice.message}</p>
      <small>Módulo: {sourceModuleLabels[notice.sourceModule]}</small>
      <time dateTime={notice.createdAt}><small>{new Date(notice.createdAt).toLocaleString('es-GT')}</small></time>
    </article>)}
    {!loading && !error && result && <nav className="pagination" aria-label="Páginas de notificaciones">
      <button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
      <span>Página {page} de {Math.max(1, Math.ceil(result.total / result.pageSize))}</span>
      <button type="button" disabled={page * result.pageSize >= result.total} onClick={() => setPage(value => value + 1)}>Siguiente</button>
    </nav>}
  </main>;
}
