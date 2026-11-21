import React, { useState, useEffect } from 'react';
import {
  fetchMyNotifications,
  NotificationRecord,
} from '../../notifications/notifications-api';
import '../../notifications/notifications.css';

export function EventosCocinaApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [events, setEvents] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await fetchMyNotifications();
      setEvents(list);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los avisos operativos de cocina.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="notif-container">
      <header className="notif-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Eventos y avisos de Cocina</strong>
        </div>
        <div className="branch-badge">H26 + H30 · KITCHEN</div>
      </header>

      <main className="notif-content">
        <div className="meta-info">
          <span className="badge-h">H26 + H30 · KITCHEN</span>
          <span className="route-tag">/kitchen/notifications</span>
        </div>

        <h1>Eventos y avisos de Cocina</h1>
        <p className="subtitle-desc">
          Solo eventos operativos de nuevos pedidos y comandas de tu sucursal.
        </p>

        <div className="card-notif-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="catalog-tag">EVENTOS DE SUCURSAL</span>
              <h2 style={{ margin: '0.2rem 0' }}>Notificaciones de cocina ({events.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={loadEvents}>
                Actualizar
              </button>
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => onNavigate('/kitchen')}
              >
                Ir a comandas (H6) →
              </button>
            </div>
          </div>

          {error && <div className="alert-error-box" style={{ marginTop: '1rem' }}>{error}</div>}

          {loading ? (
            <div className="empty-column-state" style={{ marginTop: '1rem' }}>
              Cargando eventos de cocina...
            </div>
          ) : events.length === 0 ? (
            <div className="empty-column-state" style={{ marginTop: '1rem' }}>
              No hay eventos o avisos operativos en este momento.
            </div>
          ) : (
            <div className="notif-list">
              {events.map((ev) => (
                <div key={ev.id} className="notif-item-card">
                  <div className="notif-item-header">
                    <strong>{ev.title}</strong>
                    <span className="notif-module-pill">{ev.sourceModule}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#334155' }}>
                    {ev.message}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {new Date(ev.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="notif-readonly-note">
            Los eventos se deduplican. Cocina no recibe avisos de entrega reservados para el mesero (H30).
          </div>
        </div>
      </main>
    </div>
  );
}
