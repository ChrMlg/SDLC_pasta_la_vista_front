import React, { useState, useEffect } from 'react';
import { apiRequest, extractArray, BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import './mesero-tracking.css';

export interface WaiterOrderItem {
  id: string;
  orderNumber?: number | string;
  type?: 'DINE_IN' | 'TAKEAWAY';
  status: string;
  tableNumber?: string | number | null;
  tableId?: string | null;
  branchId?: string;
}

export type WaiterOrderNotification = WaiterOrderItem;

interface PedidosAvisosMeseroProps {
  onNavigate: (path: string, order?: any) => void;
  defaultBranchId?: string | null;
}

export function PedidosAvisosMeseroApp({ onNavigate, defaultBranchId }: PedidosAvisosMeseroProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || DEFAULT_BRANCH_ID);
  const [activeTab, setActiveTab] = useState<'Todos' | 'Preparación' | 'Listos' | 'Entrega'>('Todos');
  const [orders, setOrders] = useState<WaiterOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadOrdersForSelectedBranch = async (targetBranchId: string) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await apiRequest<any>(`/branches/${targetBranchId}/orders`);
      const list = extractArray<WaiterOrderItem>(data);
      setOrders(list);
    } catch (err: any) {
      setOrders([]);
      if (err?.status === 403 || err?.status === 404) {
        setErrorMsg('No tienes acceso a los pedidos de esta sucursal.');
      } else {
        setErrorMsg(err?.message || 'No se pudieron cargar los pedidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersForSelectedBranch(branchId);
  }, [branchId]);

  const filteredOrders = orders.filter((order) => {
    const st = String(order.status || '').toUpperCase();
    if (activeTab === 'Preparación') {
      return st === 'PREPARING' || st === 'IN_PREPARATION' || st === 'PENDING';
    }
    if (activeTab === 'Listos') return st === 'READY';
    if (activeTab === 'Entrega') return st === 'DELIVERED' || st === 'PICKED_UP';
    return true;
  });

  const getServiceLabel = (order: WaiterOrderItem) => {
    if (order.type === 'TAKEAWAY') return 'Para llevar';
    if (order.tableNumber) return `Mesa ${order.tableNumber}`;
    return 'En mesa';
  };

  const getStatusPillClass = (status: string) => {
    const st = String(status || '').toUpperCase();
    if (st === 'READY') return 'status-pill ready';
    if (st === 'DELIVERED' || st === 'PICKED_UP') return 'status-pill delivery';
    return 'status-pill';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      QUEUED: 'En cola',
      UNASSIGNED: 'Sin asignar',
      PREPARING: 'En preparación',
      IN_PREPARATION: 'En preparación',
      IN_PROGRESS: 'En preparación',
      TAKEN: 'En preparación',
      READY: 'Listo',
      DELIVERED: 'Entregado',
      PICKED_UP: 'Recogido',
      CANCELLED: 'Cancelado',
    };
    return labels[String(status || '').toUpperCase()] ?? 'Estado desconocido';
  };

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / <strong>Pedidos y avisos</strong>
        </div>
      </header>

      <main className="mesero-track-content">
        <div className="meta-info">
          <span className="route-tag">/waiter/orders</span>
        </div>

        <h1>Pedidos y avisos del mesero</h1>
        <p className="subtitle-desc">
          Monitorea pedidos en preparación, listos en cocina y confirma recogida/entrega.
        </p>

        <div className="card-track-panel">
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

          <div className="order-track-top">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadOrdersForSelectedBranch(branchId)}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate('/waiter/orders/new')}
              >
                ← Nuevo pedido
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate('/notifications')}
              >
                Bandeja de avisos 
              </button>
            </div>
          </div>

          <div className="track-tabs-row">
            {(['Todos', 'Preparación', 'Listos', 'Entrega'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`track-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-orders-box">Cargando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-orders-box">
              No hay pedidos en esta vista para la sucursal seleccionada.
            </div>
          ) : (
            <div>
              {filteredOrders.map((order, index) => (
                <div key={order.id} className="order-track-card">
                  <div className="order-track-bottom">
                    <div>
                      <strong>Pedido #{order.orderNumber ?? index + 1}</strong> ·{' '}
                      {getServiceLabel(order)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className={getStatusPillClass(order.status)}>{getStatusLabel(order.status)}</span>
                      <button
                        type="button"
                        className="btn-primary-green"
                        onClick={() => onNavigate('/waiter/orders/deliver', order)}
                      >
                        Gestionar entrega →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}