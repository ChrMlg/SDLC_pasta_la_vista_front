import React, { useState } from 'react';
import './notificaciones-mesero.css';

interface WaiterNotification {
  id: string;
  title: string;
  description: string;
  sourceModule: string;
  timeAgo: string;
}

export function MeseroNotificacionesApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  // Al conectar con el backend (WebSockets H29 + GET /api/notifications)
  const [notifications] = useState<WaiterNotification[]>([]);

  return (
    <div className="notif-mesero-container">
      <header className="notif-mesero-header-bar">
        <div className="breadcrumb">
          Mesero / <strong>Notificaciones para mesero</strong>
        </div>
      </header>

      <main className="notif-mesero-content">
        <div className="meta-info">
          <span className="route-tag">/notifications</span>
        </div>

        <h1>Notificaciones para mesero</h1>

        <div className="card-notif-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">AVISOS DE SERVICIO</span>
            <h2>Tu bandeja</h2>
            <p>Solo pedidos de la sucursal/mesas que te corresponden.</p>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state-box">
              No hay avisos de servicio en este momento. Las alertas en tiempo real de cocina y mesas aparecerán aquí.
            </div>
          ) : (
            <div className="notif-items-list">
              {notifications.map(item => (
                <div key={item.id} className="notif-card-row">
                  <div className="notif-title-bold">{item.title}</div>
                  <div className="notif-desc-text">{item.description}</div>
                  <div className="notif-meta-footer">
                    <span>{item.sourceModule}</span> · <span>{item.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary-green"
              onClick={() => onNavigate('/waiter/orders')}
            >
              Ir a pedidos
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}