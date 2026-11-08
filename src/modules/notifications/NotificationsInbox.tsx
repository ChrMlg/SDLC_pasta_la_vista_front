import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Notice = { id: string; title: string; message: string; sourceModule: 'ORDERS' | 'RESERVATIONS' | 'KITCHEN'; createdAt: string; readAt: string | null };
type Page = { data: Notice[]; total: number; page: number; pageSize: number };

export function NotificationsInbox() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/notifications?page=${page}`, { credentials: 'include', signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message ?? 'No se pudieron cargar los avisos'); return data as Page; })
      .then(setResult)
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los avisos'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);
  return <main className="shell"><header><h1>Notificaciones</h1><Link to="/">Inicio</Link></header>
    <button type="button" onClick={() => setRefresh(value => value + 1)}>Actualizar</button>
    {loading && <p role="status">Cargando avisos...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {!loading && !error && result?.data.length === 0 && <p>No hay notificaciones.</p>}
    {!loading && !error && result?.data.map(notice => <article className="card" key={notice.id}>
      <h2>{notice.title}</h2><p>{notice.message}</p><small>{new Date(notice.createdAt).toLocaleString('es-GT')}</small>
    </article>)}
    {!loading && !error && result && <nav className="pagination" aria-label="Páginas de notificaciones">
      <button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
      <span>Página {page} de {Math.max(1, Math.ceil(result.total / result.pageSize))}</span>
      <button type="button" disabled={page * result.pageSize >= result.total} onClick={() => setPage(value => value + 1)}>Siguiente</button>
    </nav>}
  </main>;
}
