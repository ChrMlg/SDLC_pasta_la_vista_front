import React, { useState } from 'react';
import '../../mesero/notifications/notificaciones.css';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  source: string;
  timeAgo: string;
}

export function ClienteNotificacionesApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  // backend (GET /api/notifications) se llenará dinámicamente
  const [notifications] = useState<NotificationItem[]>([]);

  return (
    <div className="notif-container">
      <header className="notif-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Bandeja de notificaciones</strong>
        </div>
      </header>

      <main className="notif-content">
        <div className="meta-info">
          <span className="route-tag">/notifications</span>
        </div>

        <h1>Bandeja de notificaciones</h1>

        <div className="card-notif-panel">
          <div className="catalog-header-text">
            <div>
              <span className="catalog-tag">TU CENTRO DE AVISOS</span>
              <h2>Notificaciones</h2>
              <p>Eventos de pedidos, reservas y pagos dirigidos a tu cuenta.</p>
            </div>
            <button type="button" className="btn-secondary-sm" onClick={() => alert('Actualizando notificaciones...')}>
              Actualizar
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notif-box">
              No tienes notificaciones nuevas en este momento. Los avisos de tus pedidos y reservaciones aparecerán aquí.
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
            Solo lectura: no permite modificar ni eliminar avisos. Cada usuario ve únicamente los suyos.
          </div>

          <div className="form-actions">
            <button type="button" className="btn-primary-green" onClick={() => onNavigate('/')}>
              Continuar →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}