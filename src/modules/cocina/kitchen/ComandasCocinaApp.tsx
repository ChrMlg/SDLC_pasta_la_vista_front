import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { fetchKitchenOrders, KitchenOrder } from './cocina-api';
import '../cocina.css';

interface ComandasCocinaProps {
  onNavigate: (path: string, params?: any) => void;
  defaultBranchId?: string | null;
}

export function ComandasCocinaApp({ onNavigate, defaultBranchId }: ComandasCocinaProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || DEFAULT_BRANCH_ID);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSync, setLastSync] = useState('');

  const loadOrders = async () => {
    try {
      setError('');
      const list = await fetchKitchenOrders(branchId);
      setOrders(list);
      setLastSync(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las comandas de cocina.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);
  }, [branchId]);

  const isDelayedOver15Min = (createdAt?: string) => {
    if (!createdAt) return false;
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return diffMs > 15 * 60 * 1000;
  };

  const pendingOrders = orders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'QUEUED', 'UNASSIGNED'].includes(o.status)
  );
  const inProgressOrders = orders.filter((o) =>
    ['IN_PREPARATION', 'PREPARING', 'IN_PROGRESS', 'TAKEN'].includes(o.status)
  );

  const delayedCount = pendingOrders.filter((o) => isDelayedOver15Min(o.createdAt)).length;
  const branchLabel = BRANCHES.find((b) => b.id === branchId)?.label || 'Centro';

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Comandas en vivo</strong>
        </div>
        <div className="branch-badge">{branchLabel} · KITCHEN</div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
          <span className="badge-h">Cocina</span>
          <span className="route-tag">/kitchen</span>
        </div>

        <h1>Comandas de cocina</h1>
        <p className="subtitle-desc">
          Cola operativa en tiempo real por sucursal (actualización cada 5 segundos).
        </p>

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="connection-pill">
                <span className="connection-dot" /> En vivo
              </span>
              {lastSync && <span className="sync-time">Última sincronización: {lastSync}</span>}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-secondary" onClick={loadOrders}>
                Actualizar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate('/kitchen/notifications')}
              >
                Avisos
              </button>
            </div>
          </div>

          {error && <div className="alert-error-box">{error}</div>}

          {delayedCount > 0 && (
            <div className="kitchen-notice-box kitchen-notice-warning">
              Atención: hay {delayedCount} comanda(s) pendiente(s) con más de 15 minutos en espera.
            </div>
          )}

          {loading ? (
            <div className="empty-column-state">Cargando comandas activas...</div>
          ) : (
            <div className="kitchen-columns-grid">
              <div className="kitchen-column">
                <div className="column-title">
                  <span>Por tomar ({pendingOrders.length})</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Orden FIFO</span>
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="empty-column-state">No hay comandas pendientes por tomar.</div>
                ) : (
                  pendingOrders.map((order) => {
                    const delayed = isDelayedOver15Min(order.createdAt);
                    return (
                      <div
                        key={order.orderId}
                        className={`comanda-card ${delayed ? 'delayed-warning' : ''}`}
                        onClick={() =>
                          onNavigate('/kitchen/detail', {
                            branchId,
                            orderId: order.orderId,
                            order,
                          })
                        }
                      >
                        <div className="comanda-card-header">
                          <strong>
                            Pedido{' '}
                            {order.orderNumber
                              ? `#${order.orderNumber}`
                              : `#${order.orderId.slice(0, 6).toUpperCase()}`}
                          </strong>
                          <span className="status-badge unavailable">
                            {order.type === 'TAKEAWAY'
                              ? 'Para llevar'
                              : order.tableNumber
                              ? `Mesa ${order.tableNumber}`
                              : 'En mesa'}
                          </span>
                        </div>
                        <ul className="comanda-items-preview">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              • {item.name} <strong>×{item.quantity}</strong>
                            </li>
                          ))}
                        </ul>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
                          Clic para tomar comanda →
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="kitchen-column">
                <div className="column-title">
                  <span>En preparación ({inProgressOrders.length})</span>
                  <span style={{ fontSize: '0.78rem', color: '#047857' }}>Activas</span>
                </div>

                {inProgressOrders.length === 0 ? (
                  <div className="empty-column-state">No hay comandas en preparación.</div>
                ) : (
                  inProgressOrders.map((order) => {
                    const readyCount = order.items.filter((i) => i.isReady).length;
                    return (
                      <div
                        key={order.orderId}
                        className="comanda-card"
                        onClick={() =>
                          onNavigate('/kitchen/items', {
                            branchId,
                            orderId: order.orderId,
                            order,
                          })
                        }
                      >
                        <div className="comanda-card-header">
                          <strong>
                            Pedido{' '}
                            {order.orderNumber
                              ? `#${order.orderNumber}`
                              : `#${order.orderId.slice(0, 6).toUpperCase()}`}
                          </strong>
                          <span className="status-badge available">
                            {readyCount}/{order.items.length} listos
                          </span>
                        </div>
                        <ul className="comanda-items-preview">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {item.isReady ? '✓' : '○'} {item.name} <strong>×{item.quantity}</strong>
                            </li>
                          ))}
                        </ul>
                        <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.4rem' }}>
                          Clic para marcar platillos listos →
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="kitchen-notice-box">
            Los pedidos para llevar (TAKEAWAY) solo ingresan a cocina cuando su pago está confirmado (PAID).
          </div>
        </div>
      </main>
    </div>
  );
}
