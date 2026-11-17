import React, { useState } from 'react';
import './notificaciones.css';

interface WaiterNotificationItem {
  id: string;
  title: string;
  message: string;
  source: string;
  timeAgo: string;
}

export function MeseroNotificacionesApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  // Lista inicial vacía preparada para el backend
  const [notifications] = useState<WaiterNotificationItem[]>([]);

  return (
    <div className="notif-container">
      <header className="notif-header-bar">
        <div className="breadcrumb">
          Mesero / <strong>Notificaciones para mesero</strong>
        </div>
      </header>

      <main className="notif-content">
        <div className="meta-info">
          <span className="route-tag">/notifications</span>
        </div>

        <h1>Notificaciones para mesero</h1>

        <div className="card-notif-panel">
          <div className="catalog-header-text">
            <div>
              <span className="catalog-tag">AVISOS DE SERVICIO</span>
              <h2>Tu bandeja</h2>
              <p>Solo pedidos de la sucursal/mesas que te corresponden.</p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notif-box">
              No hay avisos de servicio pendientes en este momento. Las alertas de cocina y mesas aparecerán aquí.
            </div>
          ) : (
            <div className="notif-stack">
              {notifications.map(n => (
                <div key={n.id} className="notif-item-card">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-desc">{n.message}</div>
                  <div className="notif-item-footer">
                    <span>{n.source}</span> · <span>{n.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="readonly-notice">
            Solo lectura: no permite modificar ni eliminar avisos. Actualización en tiempo real.
          </div>

          {/* Botón que conecta  H9 + H29 de mesero */}
          <button
            type="button"
            className="btn-primary-green btn-full"
            onClick={() => onNavigate('/waiter/orders')}
          >
            Ir a pedidos
          </button>
        </div>
      </main>
    </div>
  );
}