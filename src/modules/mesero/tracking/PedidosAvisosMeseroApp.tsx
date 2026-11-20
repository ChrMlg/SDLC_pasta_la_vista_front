import React, { useState } from 'react';
import './mesero-tracking.css';

export interface WaiterOrderNotification {
  id: string;
  orderNumber: string;
  tableLabel: string;
  status: 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  statusText: string;
  timestamp: string;
}

export function PedidosAvisosMeseroApp({
  onNavigate,
}: {
  onNavigate: (path: string, selectedOrder?: WaiterOrderNotification) => void;
}) {
  const [activeTab, setActiveTab] = useState<'Todos' | 'Preparación' | 'Listos' | 'Entrega'>('Todos');

  const [orders] = useState<WaiterOrderNotification[]>([]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Todos') return true;
    if (activeTab === 'Preparación') return order.status === 'IN_PREPARATION';
    if (activeTab === 'Listos') return order.status === 'READY';
    if (activeTab === 'Entrega') return order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / <strong>Pedidos y avisos del mesero</strong>
        </div>
      </header>

      <main className="mesero-track-content">
        <div className="meta-info">
          <span className="route-tag">/waiter/orders</span>
        </div>

        <h1>Pedidos y avisos del mesero</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-track-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">EN SERVICIO</span>
            <h2>Seguimiento de pedidos</h2>
            <p>Notificaciones para el mesero responsable de la mesa.</p>
          </div>

          {/* Pestañas de estado  */}
          <div className="track-tabs-bar">
            {(['Todos', 'Preparación', 'Listos', 'Entrega'] as const).map(tab => (
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

          {/* Contenedor dinámico de tarjetas */}
          {filteredOrders.length === 0 ? (
            <div className="empty-orders-box">
              No hay pedidos en la sección <strong>{activeTab}</strong> en este momento. Los avisos de cocina aparecerán aquí en tiempo real.
            </div>
          ) : (
            <div className="orders-stack">
              {filteredOrders.map(order => (
                <div key={order.id} className="order-track-card">
                  <div className="order-card-top">
                    <span className="order-card-title">
                      Pedido #{order.orderNumber} · {order.tableLabel}
                    </span>
                    <span
                      className={`status-pill ${
                        order.status === 'READY'
                          ? 'ready'
                          : order.status === 'IN_PREPARATION'
                          ? 'prep'
                          : 'delivery'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-meta">
                    {order.statusText} · {order.timestamp}
                  </div>

                  {order.status === 'READY' && (
                    <button
                      type="button"
                      className="btn-primary-green btn-full"
                      onClick={() => onNavigate('/waiter/orders/delivery', order)}
                    >
                      Recoger pedido
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="track-notice-box">
            Avisos al iniciar preparación, terminar y recoger. Actualización por evento con respaldo cada 60 s.
          </div>
        </div>
      </main>
    </div>
  );
}