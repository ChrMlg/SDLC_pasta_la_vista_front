import React, { useState } from 'react';
import './cocina-items.css';

interface PlatilloItem {
  id: string;
  name: string;
  quantity: number;
  isReady: boolean;
  timeOrStatus: string;
}

export function PlatillosComandaApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [platillos] = useState<PlatilloItem[]>([]);

  const totalListos = platillos.filter(p => p.isReady).length;
  const progresoPorcentaje = platillos.length > 0 ? (totalListos / platillos.length) * 100 : 0;

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">Cocina / <strong>Platillos de la comanda</strong></div>
        <div className="branch-badge">Centro · Vista de ejemplo</div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
          <span className="route-tag">/kitchen/:id/items</span>
        </div>

        <h1>Platillos de la comanda</h1>
        <div className="card-cocina-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">PEDIDO #0106</span>
            <h2>Marca cada platillo listo</h2>
            <p>Al completar todos, la comanda y el pedido cambian a READY.</p>
          </div>

          <div className="comanda-box-container">
            <div className="comanda-box-header">
              <span className="font-semibold">{platillos.length} platillos</span>
              <span className={`status-badge ${platillos.length > 0 && totalListos === platillos.length ? 'available' : 'unavailable'}`}>
                {platillos.length > 0 && totalListos === platillos.length ? 'READY' : 'EN PROCESO'}
              </span>
            </div>

            {platillos.length === 0 ? (
              <div className="empty-column-state" style={{ margin: '1rem 0' }}>
                No hay platillos cargados en esta comanda. Los elementos aparecerán aquí al seleccionar una comanda activa.
              </div>
            ) : (
              <div className="platillos-list">
                {platillos.map(p => (
                  <div key={p.id} className="platillo-row">
                    <div className="platillo-info-left">
                      <span className={`check-icon ${p.isReady ? 'checked' : ''}`}>✓</span>
                      <span>{p.name} ×{p.quantity}</span>
                    </div>
                    <span className="platillo-status-right">{p.timeOrStatus}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="progress-section">
              <div className="progress-label-row">
                <span>Progreso</span>
                <span className="font-semibold">{totalListos} / {platillos.length} listos</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progresoPorcentaje}%` }}></div>
              </div>
            </div>
          </div>

          <div className="kitchen-notice-box" style={{ marginBottom: '1.5rem' }}>
            Cada ítem registra hora y responsable. Al terminar se avisa al mesero y al cliente.
          </div>

          <div className="form-actions space-between-actions">
            <button 
              type="button" 
              className="btn-primary-green"
              onClick={() => alert('Marcando siguiente platillo como listo...')}
              disabled={platillos.length === 0}
            >
              Marcar siguiente listo
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('/kitchen')}
            >
              Ver comandas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}