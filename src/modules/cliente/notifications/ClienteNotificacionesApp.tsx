import React, { useState } from 'react';
import './notificaciones-cliente.css';

interface CustomerNotification {
  id: string;
  title: string;
  description: string;
  sourceModule: string;
  timeAgo: string;
}

export function ClienteNotificacionesApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  const handleRefresh = () => {
    // Aquí se conectará la petición GET /api/notifications para cargar la data real del backend
    alert('Conectando con el backend para actualizar notificaciones...');
    
    // Ejemplo de cómo se llenarán las tarjetas al recibir la data del servidor:
    /*
    setNotifications([
      {
        id: '1',
        title: 'Reservación confirmada',
        description: 'Centro · 05 nov. 2026 · 14:00 · Mesa 04',
        sourceModule: 'RESERVATIONS',
        timeAgo: 'hace 8 minutos'
      },
      {
        id: '2',
        title: 'Pedido entregado',
        description: 'El pedido #0102 fue entregado correctamente.',
        sourceModule: 'KITCHEN',
        timeAgo: 'hace 1 hora'
      }
    ]);
    */
  };

  return (
    <div className="notif-cliente-container">
      <header className="notif-cliente-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Bandeja de notificaciones</strong>
        </div>
      </header>

      <main className="notif-cliente-content">
        <div className="meta-info">
          <span className="route-tag">/notifications</span>
        </div>

        <h1>Bandeja de notificaciones</h1>

        <div className="card-notif-panel">
          <div className="catalog-header-top">
            <div>
              <span className="catalog-tag">TU CENTRO DE AVISOS</span>
              <h2>Notificaciones</h2>
              <p>Eventos de pedidos, reservas y pagos dirigidos a tu cuenta.</p>
            </div>
            <button type="button" className="btn-actualizar" onClick={handleRefresh}>
              Actualizar
            </button>
          </div>

          <div className="badge-new-count">
            {notifications.length} notificaciones nuevas
          </div>

          {notifications.length === 0 ? (
            <div className="empty-state-box">
              No tienes notificaciones en este momento. Al recibir eventos del servidor, aparecerán aquí automáticamente.
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