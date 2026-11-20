import React, { useState, useEffect } from 'react';
import {
  fetchMyNotifications,
  NotificationRecord,
} from '../../notifications/notifications-api';
import '../../notifications/notifications.css';

export function MeseroNotificacionesApp({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await fetchMyNotifications();
      setNotifications(list);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las notificaciones del mesero.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="notif-container">
      <header className="notif-header-bar">
        <div className="breadcrumb">
          Mesero / <strong>Notificaciones</strong>
        </div>
      </header>

      <main className="notif-content">
        <div className="meta-info">
          <span className="route-tag">/notifications</span>
        </div>

        <h1>Notificaciones del mesero</h1>
        <p className="subtitle-desc">
          Avisos de pedidos listos en cocina y eventos operativos de tus mesas asignadas.
        </p>

        <div className="card-notif-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="catalog-tag">AVISOS OPERATIVOS</span>
              <h2 style={{ margin: '0.2rem 0' }}>Bandeja del mesero ({notifications.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={loadNotifications}>
                Actualizar
              </button>
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => onNavigate('/waiter/orders')}
              >
                Ir a pedidos →
              </button>
            </div>
          </div>

          {error && <div className="alert-error-box" style={{ marginTop: '1rem' }}>{error}</div>}

          {loading ? (
            <div className="empty-column-state" style={{ marginTop: '1rem' }}>
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-column-state" style={{ marginTop: '1rem' }}>
              No hay avisos nuevos para tus mesas en este momento.
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((n) => (
                <div key={n.id} className="notif-item-card">
                  <div className="notif-item-header">
                    <strong>{n.title}</strong>
                    <span className="notif-module-pill">{n.sourceModule}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#334155' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="notif-readonly-note">
            Solo lectura. Usa «Ir a pedidos» para confirmar entrega y entrega.
          </div>
        </div>
      </main>
    </div>
  );
}
