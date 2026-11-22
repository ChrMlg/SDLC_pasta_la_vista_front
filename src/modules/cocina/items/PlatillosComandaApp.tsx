import React, { useState, useEffect } from 'react';
import { apiRequest, extractArray, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import '../kitchen/cocina.css';
import './cocina-items.css';

interface KitchenOrderItem {
  id: string;
  dishName?: string;
  name?: string;
  quantity: number;
  note?: string | null;
  isReady: boolean;
  readyAt?: string | null;
}

interface KitchenComanda {
  orderId: string;
  orderNumber?: number | string;
  tableLabel?: string;
  type?: string;
  status: string;
  items: KitchenOrderItem[];
}

interface PlatillosComandaProps {
  onNavigate: (path: string, orderId?: any) => void;
  selectedOrderId?: string | null;
  orderId?: string | null;
  branchId?: string | null;
}

export function PlatillosComandaApp({
  onNavigate,
  selectedOrderId,
  orderId,
  branchId,
}: PlatillosComandaProps) {
  const activeBranchId = branchId || DEFAULT_BRANCH_ID;
  const targetOrderId = selectedOrderId || orderId || '';

  const [comanda, setComanda] = useState<KitchenComanda | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [readyDishMessage, setReadyDishMessage] = useState('');

  const normalizeComanda = (raw: any): KitchenComanda | null => {
    if (!raw) return null;
    const rawItems = Array.isArray(raw.items) ? raw.items : [];
    return {
      orderId: String(raw.orderId ?? raw.id ?? ''),
      orderNumber: raw.orderNumber,
      tableLabel: raw.tableLabel,
      type: raw.type,
      status: String(raw.status || 'PENDING'),
      items: rawItems.map((it: any) => ({
        id: String(it.id ?? it.itemId ?? ''),
        dishName: it.dishName ?? it.name ?? 'Platillo',
        quantity: Number(it.quantity ?? 1),
        note: it.note ?? null,
        isReady: Boolean(it.isReady),
        readyAt: it.readyAt ?? null,
      })),
    };
  };

  const loadComanda = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      if (!targetOrderId) {
        setComanda(null);
        return;
      }

      const data = await apiRequest<any>(`/branches/${activeBranchId}/kitchen/orders`);
      const list = Array.isArray(data?.items) ? data.items : extractArray<any>(data);
      const found = list.find(
        (o: any) => String(o.orderId ?? o.id ?? '') === String(targetOrderId)
      );

      if (found) {
        setComanda(normalizeComanda(found));
      } else {
        setComanda((prev) => (prev && prev.orderId === String(targetOrderId) ? prev : null));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudieron cargar los platillos de la comanda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReadyDishMessage('');
    loadComanda();
  }, [targetOrderId, activeBranchId]);

  const handleMarkItemReady = async (item: KitchenOrderItem) => {
    if (!comanda || !comanda.orderId || updatingItemId) return;

    try {
      setUpdatingItemId(item.id);
      setErrorMsg('');

      await apiRequest(
        `/branches/${activeBranchId}/kitchen/orders/${comanda.orderId}/items/${item.id}/ready`,
        {
          method: 'PATCH',
          cache: 'no-store',
        }
      );

      const dishLabel = item.dishName ?? item.name ?? 'Platillo';
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const updatedItems = comanda.items.map((it) =>
        it.id === item.id ? { ...it, isReady: true, readyAt: nowLabel } : it
      );
      const allReady = updatedItems.length > 0 && updatedItems.every((it) => it.isReady);

      setComanda({
        ...comanda,
        status: allReady ? 'READY' : comanda.status,
        items: updatedItems,
      });

      setReadyDishMessage(
        allReady
          ? `El platillo "${dishLabel}" ya está listo. ¡Todos los platillos de esta comanda ya están listos!`
          : `El platillo "${dishLabel}" ya está listo.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudo marcar el platillo como listo.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const totalCount = comanda?.items.length ?? 0;
  const readyCount = comanda?.items.filter((i) => i.isReady).length ?? 0;
  const nextPendingItem = comanda?.items.find((i) => !i.isReady);
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Platillos de la comanda</strong>
        </div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
        </div>

        <div className="card-cocina-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">
              PEDIDO #{comanda?.orderNumber ?? (targetOrderId || '—')}
            </span>
            <h2>Marca cada platillo listo</h2>
          </div>

          {errorMsg && (
            <div
              className="alert-error"
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          {readyDishMessage && (
            <div
              className="alert-success"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              {readyDishMessage}
            </div>
          )}

          {loading && !comanda ? (
            <div className="empty-menu-state">Cargando platillos de la comanda...</div>
          ) : !comanda ? (
            <div className="empty-menu-state">
              No hay una comanda activa seleccionada en este momento.
            </div>
          ) : (
            <>
              <div className="order-items-list">
                {comanda.items.map((item) => (
                  <div
                    key={item.id}
                    className={`order-item-row ${item.isReady ? 'item-selected' : ''}`}
                  >
                    <div className="dish-info-left">
                      <div className={`status-dot ${item.isReady ? 'available' : ''}`} />
                      <div>
                        <h4 className="item-title">
                          {item.dishName ?? item.name} ×{item.quantity}
                        </h4>
                        {item.note && <span className="item-sub">Nota: {item.note}</span>}
                      </div>
                    </div>

                    <div className="dish-action-right">
                      {item.isReady ? (
                        <span className="text-avail">
                          ✓ Ya está listo{item.readyAt ? ` · ${item.readyAt}` : ''}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={updatingItemId === item.id}
                          onClick={() => handleMarkItemReady(item)}
                        >
                          {updatingItemId === item.id ? 'Marcando...' : 'Listo'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-totals-row">
                <div>
                  <strong>Progreso</strong>
                  <span className="items-selected-pill">
                    {readyCount} / {totalCount} listos ({progressPercent}%)
                  </span>
                </div>
                <span className="status-pill ready">{({
                  PENDING: 'Pendiente',
                  CONFIRMED: 'Confirmado',
                  QUEUED: 'En cola',
                  UNASSIGNED: 'Sin asignar',
                  PREPARING: 'En preparación',
                  IN_PREPARATION: 'En preparación',
                  IN_PROGRESS: 'En preparación',
                  TAKEN: 'En preparación',
                  READY: 'Listo',
                  OUT_FOR_DELIVERY: 'En camino',
                  DELIVERED: 'Entregado',
                  PICKED_UP: 'Recogido',
                  CANCELLED: 'Cancelado',
                } as Record<string, string>)[comanda.status] ?? 'Estado desconocido'}</span>
              </div>

              <div
                className="form-actions"
                style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
              >
                {nextPendingItem && (
                  <button
                    type="button"
                    className="btn-primary-green"
                    disabled={Boolean(updatingItemId)}
                    onClick={() => handleMarkItemReady(nextPendingItem)}
                  >
                    {updatingItemId ? 'Marcando...' : 'Marcar siguiente listo'}
                  </button>
                )}

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate('/kitchen')}
                >
                  Ver comandas
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}