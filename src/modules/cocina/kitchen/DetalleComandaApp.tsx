import React, { useState, useEffect, useCallback } from 'react';
import './cocina.css';

interface DetalleComandaProps {
  onNavigate: (path: string, comandaId?: string) => void;
  comandaId?: string;
  branchId?: string;
}

interface ComandaDetalleData {
  id: string;
  status: string;
  takenBy: string;
  readyCount: number;
  pendingItemsCount: number;
  items: Array<{
    id?: string;
    name: string;
    quantity?: number;
    isReady?: boolean;
  }>;
}

export function DetalleComandaApp({
  onNavigate,
  comandaId,
  branchId = 'a1111111-1111-4111-8111-111111111111',
}: DetalleComandaProps) {
  const [comanda, setComanda] = useState<ComandaDetalleData>({
    id: comandaId || '',
    status: 'PENDING',
    takenBy: 'Sin asignar',
    readyCount: 0,
    pendingItemsCount: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadComandaDetail = useCallback(async () => {
    if (!comandaId) return;
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) return;

      const payload = await res.json();
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.orders)
        ? payload.orders
        : [];

      const found = list.find((o) => String(o?.id ?? o?.orderId ?? '') === String(comandaId));
      if (!found) return;

      const rawItems: any[] = Array.isArray(found.items) ? found.items : [];
      const normalizedItems = rawItems.map((it) => ({
        id: it?.id ?? it?.itemId,
        name: it?.name || it?.dishName || it?.menuItem?.name || 'Platillo',
        quantity: it?.quantity,
        isReady: Boolean(it?.isReady ?? it?.ready ?? it?.status === 'READY'),
      }));

      const readyCount = normalizedItems.filter((i) => i.isReady).length;
      const pendingItemsCount = normalizedItems.filter((i) => !i.isReady).length;

      const cookRaw = found.assignedCook ?? found.takenBy ?? found.cook;
      const takenBy =
        typeof cookRaw === 'string' && cookRaw.trim()
          ? cookRaw
          : cookRaw?.name || cookRaw?.email || 'Sin asignar';

      setComanda({
        id: String(found.id ?? found.orderId ?? comandaId),
        status: String(found.status ?? found.state ?? 'PENDING').toUpperCase(),
        takenBy,
        readyCount,
        pendingItemsCount,
        items: normalizedItems,
      });
    } catch {
      // Mantiene el estado actual si la consulta auxiliar falla
    } finally {
      setLoading(false);
    }
  }, [branchId, comandaId]);

  useEffect(() => {
    loadComandaDetail();
  }, [loadComandaDetail]);

  const handlePrepare = async () => {
    if (!comandaId) {
      setError('No se recibió el ID de la comanda.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders/${comandaId}/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message ||
            (res.status === 409
              ? 'Otro cocinero ya tomó esta comanda. Actualizando...'
              : `No se pudo tomar la comanda (${res.status}).`)
        );
      }

      setComanda((prev) => ({ ...prev, status: 'IN_PREPARATION' }));
      setMessage('Comanda marcada como en preparación.');
      await loadComandaDetail();
    } catch (err: any) {
      setError(err?.message || 'Error al tomar la comanda.');
      await loadComandaDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!comandaId) {
      setError('No se recibió el ID de la comanda.');
      return;
    }

    const confirmed = window.confirm(
      '¿Liberar comanda a pendientes? Requiere confirmación y únicamente es posible si todavía no hay platillos listos.'
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders/${comandaId}/release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message || `No se pudo liberar la comanda (${res.status}). Verifica si ya hay platillos listos.`
        );
      }

      setComanda((prev) => ({ ...prev, status: 'PENDING', takenBy: 'Sin asignar' }));
      onNavigate('/kitchen');
    } catch (err: any) {
      setError(err?.message || 'Error al liberar la comanda.');
      await loadComandaDetail();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Tomar o liberar una comanda</strong>
        </div>
        <div className="branch-badge">Cocina · H7</div>
      </header>

      <main className="cocina-content">
        <h1>Tomar o liberar una comanda</h1>
        <p className="subtitle-desc">H7 · Gestión de asignación de comanda en cocina.</p>

        {error && <div className="kitchen-notice-box kitchen-notice-warning">{error}</div>}
        {message && (
          <div className="kitchen-notice-box" style={{ borderLeftColor: '#10b981', color: '#065f46', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div>
              <span className="catalog-tag">PEDIDO ACTIVO</span>
              <h2 style={{ margin: '0.2rem 0' }}>Gestión de comanda</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                Solo una persona puede tomar la comanda a la vez.
              </p>
            </div>
            <button
              type="button"
              onClick={loadComandaDetail}
              disabled={loading || submitting}
              style={{
                background: '#334155',
                color: '#fff',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>

          <div
            style={{
              background: '#fafaf9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1.25rem',
              margin: '1.5rem 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <strong>Comanda {comanda.id ? `#${comanda.id.slice(0, 8)}` : ''}</strong>
              <span className="comanda-badge">{comanda.status}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#475569', fontSize: '0.9rem' }}>
              <span>Tomada por</span>
              <strong style={{ color: '#0f172a' }}>{comanda.takenBy}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#475569', fontSize: '0.9rem' }}>
              <span>Platillos listos / pendientes</span>
              <strong style={{ color: '#0f172a' }}>
                {comanda.readyCount} listos · {comanda.pendingItemsCount} pendientes
              </strong>
            </div>

            {comanda.items.length > 0 && (
              <ul className="comanda-items-list" style={{ marginTop: '0.75rem' }}>
                {comanda.items.map((item, idx) => (
                  <li key={item.id || `${item.name}-${idx}`}>
                    {item.quantity ? `${item.quantity}x ` : ''}
                    {item.name} {item.isReady ? '(Listo)' : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="kitchen-notice-box kitchen-notice-warning">
            Liberar requiere confirmación y únicamente es posible si todavía no hay platillos listos.
          </div>

          <div className="kitchen-notice-box" style={{ marginBottom: '1.5rem' }}>
            Si otro cocinero ya tomó la comanda, mostrar conflicto y actualizar la lista.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={submitting || !comandaId}
                onClick={handlePrepare}
                style={{
                  background: '#064e3b',
                  color: '#fff',
                  border: 'none',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: submitting || !comandaId ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Procesando...' : 'Preparar comanda'}
              </button>

              <button
                type="button"
                disabled={submitting || !comandaId}
                onClick={handleRelease}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: submitting || !comandaId ? 'not-allowed' : 'pointer',
                }}
              >
                Liberar a pendientes
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/kitchen')}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '0.65rem 1.15rem',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ← Volver a comandas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}