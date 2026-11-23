import React, { useState, useEffect } from 'react';
import { DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import {
  fetchKitchenOrders,
  KitchenOrder,
  releaseKitchenOrder,
  takeKitchenOrder,
} from './cocina-api';
import '../cocina.css';

interface DetalleComandaProps {
  branchId?: string;
  orderId?: string;
  initialOrder?: KitchenOrder | null;
  onNavigate: (path: string, params?: any) => void;
}

export function DetalleComandaApp({
  branchId = DEFAULT_BRANCH_ID,
  orderId,
  initialOrder,
  onNavigate,
}: DetalleComandaProps) {
  const [order, setOrder] = useState<KitchenOrder | null>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const all = await fetchKitchenOrders(branchId);
      const found = orderId
        ? all.find((o) => o.orderId === orderId) || all[0] || null
        : all[0] || null;
      setOrder(found);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el detalle de la comanda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialOrder || orderId) {
      loadOrderDetail();
    }
  }, [branchId, orderId]);

  const handleTakeOrder = async () => {
    if (!order) return;
    try {
      setProcessing(true);
      setError('');
      await takeKitchenOrder(branchId, order.orderId);
      onNavigate('/kitchen/items', { branchId, orderId: order.orderId });
    } catch (err: any) {
      setError(err.message || 'No se pudo tomar la comanda.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReleaseOrder = async () => {
    if (!order) return;
    try {
      setProcessing(true);
      setError('');
      await releaseKitchenOrder(branchId, order.orderId);
      onNavigate('/kitchen');
    } catch (err: any) {
      setError(err.message || 'No se pudo liberar la comanda.');
    } finally {
      setProcessing(false);
    }
  };

  const readyCount = order ? order.items.filter((i) => i.isReady).length : 0;
  const pendingCount = order ? order.items.length - readyCount : 0;

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Tomar o liberar comanda</strong>
        </div>
      </header>

      <main className="cocina-content" style={{ maxWidth: '760px' }}>
        <div className="meta-info">

        </div>

        <h1>Detalle de comanda</h1>
        <p className="subtitle-desc">
          Asigna la comanda a preparación o libérala nuevamente a pendientes.
        </p>

        <div className="card-cocina-panel">
          {error && <div className="alert-error-box">{error}</div>}

          {loading ? (
            <div className="empty-column-state">Cargando información de la comanda...</div>
          ) : !order ? (
            <div className="empty-column-state">
              No hay una comanda seleccionada actualmente.
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate('/kitchen')}
                >
                  ← Volver a comandas
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <span className="catalog-tag">COMANDA OPERATIVA</span>
                  <h2 style={{ margin: '0.2rem 0' }}>
                    Pedido{' '}
                    {order.orderNumber
                      ? `#${order.orderNumber}`
                      : `#${order.orderId.slice(0, 6).toUpperCase()}`}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {readyCount} listos · {pendingCount} pendientes · Estado: {{
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
                    }[order.status] ?? 'Estado desconocido'}
                  </span>
                </div>
                <span className="status-badge available">
                  {order.type === 'TAKEAWAY'
                    ? 'Para llevar'
                    : order.tableNumber
                    ? `Mesa ${order.tableNumber}`
                    : 'En mesa'}
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`dish-checklist-row ${item.isReady ? 'is-ready' : ''}`}
                  >
                    <div>
                      <strong>{item.name}</strong> ×{item.quantity}
                      {item.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Nota: {item.notes}
                        </div>
                      )}
                    </div>
                    <span className={`status-badge ${item.isReady ? 'available' : 'unavailable'}`}>
                      {item.isReady ? 'Listo' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate('/kitchen')}
                  disabled={processing}
                >
                  ← Volver a comandas
                </button>
                <button
                  type="button"
                  className="btn-primary-green"
                  onClick={handleTakeOrder}
                  disabled={processing}
                >
                  {processing ? 'Procesando...' : 'Preparar comanda'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    onNavigate('/kitchen/items', { branchId, orderId: order.orderId, order })
                  }
                  disabled={processing}
                >
                  Ir a platillos →
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReleaseOrder}
                  disabled={processing}
                >
                  Liberar a pendientes
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
