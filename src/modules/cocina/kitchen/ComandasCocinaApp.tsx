import React, { useState } from 'react';
import './cocina.css';

interface ComandaItem {
  id: string;
  tableOrType: string;
  itemsSummary: string[];
  minutesWaiting?: number;
  assignedCook?: string;
}

export function ComandasCocinaApp({ onNavigate }: { onNavigate: (path: string, comandaId?: string) => void }) {
  const [pendientes] = useState<ComandaItem[]>([]);
  const [enPreparacion] = useState<ComandaItem[]>([]);

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">Cocina / <strong>Comandas de cocina</strong></div>
        <div className="branch-badge">Centro · Vista de ejemplo</div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
        </div>

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div>
              <span className="catalog-tag">OPERACIÓN EN VIVO</span>
              <h2>Comandas de Centro</h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                Cola de ingreso por antigüedad, actualizada cada 5 segundos.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="connection-pill">
                <span className="connection-dot"></span> Conectado
              </div>
              <span className="sync-time">Actualizado hace 5 s</span>
            </div>
          </div>

          <div className="kitchen-columns-grid">
            {/* Columna de Pendientes */}
            <div className="kitchen-column">
              <div className="column-title">
                <span>Pendientes</span>
                <span className="pill-count">{pendientes.length}</span>
              </div>

              {pendientes.length === 0 ? (
                <div className="empty-column-state">
                  No hay comandas pendientes. Las órdenes nuevas aparecerán aquí en tiempo real.
                </div>
              ) : (
                pendientes.map(c => (
                  <div key={c.id} onClick={() => onNavigate('/kitchen/detail', c.id)} style={{ cursor: 'pointer' }}>
                    {/* Renderizado de tarjeta pendiente */}
                  </div>
                ))
              )}
            </div>

            {/* Columna En preparación */}
            <div className="kitchen-column">
              <div className="column-title">
                <span>En preparación</span>
                <span className="pill-count">{enPreparacion.length}</span>
              </div>

              {enPreparacion.length === 0 ? (
                <div className="empty-column-state">
                  No hay comandas en preparación actualmente.
                </div>
              ) : (
                enPreparacion.map(c => (
                  <div key={c.id} onClick={() => onNavigate('/kitchen/detail', c.id)} style={{ cursor: 'pointer' }}>
                    {/* Renderizado de tarjeta en preparación */}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="kitchen-notice-box">
            Las pendientes de más de 15 min se resaltan. Los pedidos para llevar entran solo tras pago PAID.
          </div>
        </div>
      </main>
    </div>
  );
}