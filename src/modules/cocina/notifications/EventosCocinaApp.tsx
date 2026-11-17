import React, { useState } from 'react';
import './cocina-notifications.css';

interface KitchenEvent {
  id: string;
  title: string;
  description: string;
  statusType: string;
  timestamp: string;
}

export function EventosCocinaApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  //  Cuando el backend emita eventos vía WebSockets / API, se poblarán aquí zzz
  const [events] = useState<KitchenEvent[]>([]);

  return (
    <div className="cocina-notif-container">
      <header className="cocina-notif-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Eventos y avisos de Cocina</strong>
        </div>
      </header>

      <main className="cocina-notif-content">
        <div className="meta-info">

          <span className="route-tag">/kitchen/notifications</span>
        </div>

        <h1>Eventos y avisos de Cocina</h1>

        <div className="card-notif-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">EVENTOS DE SUCURSAL</span>
            <h2>Notificaciones de cocina</h2>
            <p>Solo eventos de pedidos y comandas de tu sucursal.</p>
          </div>

          {events.length === 0 ? (
            <div className="empty-state-box">
              No hay eventos o avisos operativos en este momento. Las alertas en tiempo real de nuevos pedidos y comandas aparecerán aquí.
            </div>
          ) : (
            <div className="events-items-list">
              {events.map(ev => (
                <div key={ev.id} className="event-card-row">
                  <div className="event-title-bold">{ev.title}</div>
                  <div className="event-desc-text">{ev.description}</div>
                  <div className="event-meta-footer">
                    {ev.statusType} · {ev.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dedup-notice-box">
            Los eventos se deduplican. Cocina no recibe notificaciones de entrega reservadas para el mesero.
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary-green"
              onClick={() => onNavigate('/kitchen')}
            >
              Continuar →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}