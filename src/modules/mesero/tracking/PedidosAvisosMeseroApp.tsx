import React, { useState } from 'react';
import './mesero-tracking.css';

export interface WaiterOrderNotification {
  id: string;
  orderNumber: string;
  status: 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  tableOrService?: string;
  itemsSummary?: string[];
}

interface PedidosAvisosMeseroProps {
  onNavigate: (path: string, order?: WaiterOrderNotification) => void;
  orders?: WaiterOrderNotification[];
}

type FilterTab = 'ALL' | 'PREPARATION' | 'READY' | 'DELIVERY';

export function PedidosAvisosMeseroApp({
  onNavigate,
  orders = [],
}: PedidosAvisosMeseroProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'PREPARATION') return order.status === 'IN_PREPARATION';
    if (activeTab === 'READY') return order.status === 'READY';
    if (activeTab === 'DELIVERY') {
      return order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED';
    }
    return true;
  });

  const handleGoToDelivery = (order: WaiterOrderNotification) => {
    onNavigate('/waiter/orders/delivery', order);
  };

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / <strong>Pedidos y avisos</strong>
        </div>
        <span className="branch-badge">H9 + H29 · WAITER</span>
      </header>

      <main className="mesero-track-content">
        <h1>Pedidos y avisos de mesero</h1>
        <p className="subtitle-desc">
          Seguimiento de estados y avisos en tiempo real listos para conectar con el backend.
        </p>

        <div className="card-track-panel">
          <div>
            <span className="catalog-tag">SEGUIMIENTO OPERATIVO</span>
            <h2 className="panel-title">Pedidos y avisos</h2>
            <p className="panel-subtitle">
              Filtra por estado y entra a recogida o entrega cuando el pedido esté listo.
            </p>
          </div>

          <div className="track-tabs-row">
            <button
              type="button"
              className={`track-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Todos
            </button>
            <button
              type="button"
              className={`track-tab-btn ${activeTab === 'PREPARATION' ? 'active' : ''}`}
              onClick={() => setActiveTab('PREPARATION')}
            >
              Preparación
            </button>
            <button
              type="button"
              className={`track-tab-btn ${activeTab === 'READY' ? 'active' : ''}`}
              onClick={() => setActiveTab('READY')}
            >
              Listos
            </button>
            <button
              type="button"
              className={`track-tab-btn ${activeTab === 'DELIVERY' ? 'active' : ''}`}
              onClick={() => setActiveTab('DELIVERY')}
            >
              Entrega
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-orders-box">
              No hay pedidos o avisos en este momento. Cuando entren órdenes desde el backend aparecerán aquí.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="order-track-card">
                <div className="order-track-top">
                  <strong>Pedido #{order.orderNumber}</strong>
                  <span className={`status-pill ${order.status === 'READY' ? 'ready' : ''}`}>
                    {order.status}
                  </span>
                </div>

                {order.tableOrService && (
                  <p className="step-card-desc">{order.tableOrService}</p>
                )}

                {order.itemsSummary && order.itemsSummary.length > 0 && (
                  <ul className="comanda-items-list">
                    {order.itemsSummary.map((line, idx) => (
                      <li key={`${order.id}-${idx}`}>{line}</li>
                    ))}
                  </ul>
                )}

                <div className="order-track-bottom">
                  <span className="sync-time">ID: {order.id}</span>
                  <button
                    type="button"
                    className="btn-cocina btn-primary"
                    onClick={() => handleGoToDelivery(order)}
                    disabled={order.status !== 'READY' && order.status !== 'OUT_FOR_DELIVERY'}
                  >
                    Recoger pedido
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="track-footer-actions">
            <button
              type="button"
              className="btn-cocina btn-secondary"
              onClick={() => onNavigate('/waiter/orders/new')}
            >
              ← Nuevo pedido
            </button>
            <button
              type="button"
              className="btn-cocina btn-secondary"
              onClick={() => onNavigate('/waiter/orders/delivery')}
            >
              Vista recogida y entrega (H9)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}