import React, { useState } from 'react';
import './cocina.css';

interface DetalleComandaProps {
  onNavigate: (path: string) => void;
  comandaId?: string;
}

export function DetalleComandaApp({ onNavigate }: DetalleComandaProps) {
  const [comandaStatus, setComandaStatus] = useState<'IN_PREPARATION' | 'PENDING'>('IN_PREPARATION');

  const handlePrepare = () => {
    alert('Comanda marcada como en preparación.');
    setComandaStatus('IN_PREPARATION');
  };

  const handleRelease = () => {
    if (window.confirm('¿Liberar comanda a pendientes? Requiere confirmación y solo es posible si todavía no hay platillos listos.')) {
      setComandaStatus('PENDING');
      onNavigate('/kitchen');
    }
  };

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">Cocina / <strong>Tomar o liberar una comanda</strong></div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
          <span className="badge-h">H7 · KITCHEN</span>
        </div>

        <h1>Tomar o liberar una comanda</h1>

        <div className="card-cocina-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">PEDIDO ACTIVO</span>
            <h2>Gestión de comanda</h2>
          </div>

          <div className="availability-box" style={{ background: '#fafaf9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', margin: '1.5rem 0' }}>
            <div className="availability-row-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="dish-title-bold">Detalle de Comanda</span>
              <span className="status-badge available">{comandaStatus}</span>
            </div>
            <div className="availability-row-detail" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#475569', fontSize: '0.9rem' }}>
              <span>Tomada por</span>
              <span className="font-semibold">Cocina Centro</span>
            </div>
            <div className="availability-row-detail" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#475569', fontSize: '0.9rem' }}>
              <span>Platillos listos</span>
              <span className="font-semibold">0 pendientes</span>
            </div>
          </div>

          <div className="kitchen-notice-box kitchen-notice-warning">
            Liberar requiere confirmación y únicamente es posible si todavía no hay platillos listos.
          </div>
          <div className="form-actions space-between-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn-primary-green"
                onClick={handlePrepare}
              >
                Preparar comanda
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleRelease}
              >
                Liberar a pendientes
              </button>
            </div>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('/kitchen')}
            >
              ← Volver a comandas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}