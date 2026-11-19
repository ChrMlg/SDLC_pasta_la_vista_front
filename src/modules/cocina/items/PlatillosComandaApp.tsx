import React, { useState, useEffect, useCallback } from 'react';
import '../kitchen/cocina.css';

interface PlatillosComandaProps {
  onNavigate: (path: string, comandaId?: string) => void;
  comandaId?: string;
  branchId?: string;
}

interface PlatilloItem {
  id: string;
  name: string;
  quantity: number;
  note?: string | null;
  isReady: boolean;
  timeOrStatus: string;
}

export function PlatillosComandaApp({
  onNavigate,
  comandaId,
  branchId = 'a1111111-1111-4111-8111-111111111111',
}: PlatillosComandaProps) {
  const [platillos, setPlatillos] = useState<PlatilloItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<number | string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('EN PROCESO');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadPlatillos = useCallback(async () => {
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
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.orders)
        ? payload.orders
        : [];

      const found = list.find((o) => String(o?.orderId ?? o?.id ?? '') === String(comandaId));
      if (!found) return;

      if (found.orderNumber !== undefined) setOrderNumber(found.orderNumber);

      const rawItems: any[] = Array.isArray(found.items) ? found.items : [];
      const mapped: PlatilloItem[] = rawItems.map((it, idx) => {
        const isReady = Boolean(it?.isReady ?? it?.ready ?? it?.status === 'READY');
        const readyAtLabel = it?.readyAt
          ? new Date(it.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';
        return {
          id: String(it?.id ?? it?.itemId ?? `${comandaId}-${idx}`),
          name: it?.dishName || it?.name || it?.menuItem?.name || 'Platillo',
          quantity: Number(it?.quantity ?? 1),
          note: it?.note ?? it?.notes ?? null,
          isReady,
          timeOrStatus: isReady ? `Listo${readyAtLabel ? ` · ${readyAtLabel}` : ''}` : 'Pendiente',
        };
      });

      setPlatillos(mapped);
      const allReady = mapped.length > 0 && mapped.every((p) => p.isReady);
      setOrderStatus(
        allReady ? 'READY' : String(found.status ?? found.state ?? 'EN PROCESO').toUpperCase()
      );
    } catch {
      // Mantiene la lista actual si ocurre un error de red temporal
    } finally {
      setLoading(false);
    }
  }, [branchId, comandaId]);

  useEffect(() => {
    loadPlatillos();
  }, [loadPlatillos]);

  const markItemReady = async (itemId: string) => {
    if (!comandaId || !itemId) return;
    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const res = await fetch(
        `/api/branches/${branchId}/kitchen/orders/${comandaId}/items/${itemId}/ready`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.message || `No se pudo marcar el platillo como listo (${res.status}).`
        );
      }

      setMessage('Platillo marcado como listo.');
      await loadPlatillos();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el platillo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextReady = async () => {
    const nextItem = platillos.find((p) => !p.isReady);
    if (!nextItem) return;
    await markItemReady(nextItem.id);
  };

  const totalListos = platillos.filter((p) => p.isReady).length;
  const progresoPorcentaje =
    platillos.length > 0 ? Math.round((totalListos / platillos.length) * 100) : 0;
  const isAllReady = platillos.length > 0 && totalListos === platillos.length;

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Platillos de la comanda</strong>
        </div>
        <div className="header-controls">
          <span className="branch-badge">Cocina · H8</span>
        </div>
      </header>

      <main className="cocina-content">
        <div className="cocina-title-row">
          <div>
            <h1>Platillos de la comanda</h1>
            <p className="subtitle-desc">H8 · Control de preparación por platillo.</p>
          </div>
          <button
            type="button"
            className="btn-cocina btn-secondary"
            onClick={() => onNavigate('/kitchen/detail', comandaId)}
          >
            Ir a detalle (H7)
          </button>
        </div>

        {error && <div className="kitchen-notice-box kitchen-notice-warning">{error}</div>}
        {message && <div className="kitchen-notice-box kitchen-notice-success">{message}</div>}

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div>
              <span className="catalog-tag">
                {orderNumber
                  ? `PEDIDO #${orderNumber}`
                  : comandaId
                  ? `COMANDA #${comandaId.slice(0, 8)}`
                  : 'COMANDA ACTIVA'}
              </span>
              <h2 className="panel-title">Marca cada platillo listo</h2>
              <p className="panel-subtitle">
                Al completar todos, la comanda y el pedido cambian a READY.
              </p>
            </div>
            <button
              type="button"
              className="btn-cocina btn-dark"
              onClick={loadPlatillos}
              disabled={loading || submitting}
            >
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>

          <div className="detalle-box">
            <div className="detalle-header">
              <strong>
                {platillos.length} {platillos.length === 1 ? 'platillo' : 'platillos'}
              </strong>
              <span className={`comanda-badge ${isAllReady ? 'badge-ready' : ''}`}>
                {isAllReady ? 'READY' : orderStatus}
              </span>
            </div>

            {platillos.length === 0 ? (
              <div className="empty-column-state">
                No hay platillos cargados en esta comanda. Los elementos aparecerán aquí al
                seleccionar una comanda activa.
              </div>
            ) : (
              <div className="platillos-list">
                {platillos.map((p) => (
                  <div key={p.id} className="platillo-row">
                    <div className="platillo-info-left">
                      <span className={`platillo-check ${p.isReady ? 'done' : ''}`}>✓</span>
                      <div>
                        <span>
                          {p.name} ×{p.quantity}
                        </span>
                        {p.note && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Nota: {p.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-gap-sm">
                      <span className="platillo-status">{p.timeOrStatus}</span>
                      {!p.isReady && (
                        <button
                          type="button"
                          className="btn-cocina btn-primary btn-mini"
                          disabled={submitting}
                          onClick={() => markItemReady(p.id)}
                        >
                          Listo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="progress-section">
              <div className="detalle-row">
                <span>Progreso</span>
                <strong>
                  {totalListos} / {platillos.length} listos ({progresoPorcentaje}%)
                </strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progresoPorcentaje}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="kitchen-notice-box">
            Cada ítem registra hora y responsable. Al terminar se avisa al mesero y al cliente.
          </div>

          <div className="detalle-actions">
            <button
              type="button"
              className="btn-cocina btn-primary"
              disabled={submitting || isAllReady || platillos.length === 0}
              onClick={handleNextReady}
            >
              {submitting ? 'Guardando...' : 'Marcar siguiente listo'}
            </button>

            <button
              type="button"
              className="btn-cocina btn-secondary"
              onClick={() => onNavigate('/kitchen')}
            >
              Ver comandas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}