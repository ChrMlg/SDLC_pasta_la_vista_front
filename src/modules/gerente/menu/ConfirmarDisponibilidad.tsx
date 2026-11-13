import React, { useState } from 'react';
import './gerente-menu.css';

interface ConfirmarDisponibilidadProps {
  onNavigate: (path: string) => void;
  dishName?: string;
  branchName?: string;
}

export function ConfirmarDisponibilidad({ 
  onNavigate, 
  dishName = 'Ensalada fresca', 
  branchName = 'Centro' 
}: ConfirmarDisponibilidadProps) {
  // Estado para simular el cambio de estado actual a su contrario
  const [targetStatus, setTargetStatus] = useState<'Disponible' | 'No disponible'>('Disponible');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    setSubmitting(true);
    setTimeout(() => {
      alert('Disponibilidad actualizada');
      setSubmitting(false);
      onNavigate('/management/menu');
    }, 500);
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Confirmar disponibilidad</strong></div>
        <div className="gerente-branch-badge">{branchName} - Vista de ejemplo</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H2 · MANAGER</span>
          <span className="route-tag">/management/menu/:id/availability</span>
        </div>
        
        <h1>Confirmar disponibilidad</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-catalog availability-card-wrapper">
          <div className="catalog-header-text">
            <span className="catalog-tag">DISPONIBILIDAD</span>
            <h2>¿Confirmar cambio?</h2>
            <p>Cambiarás el estado de disponibilidad del platillo seleccionado.</p>
          </div>

          {/* Tarjeta interna de detalle */}
          <div className="availability-box">
            <div className="availability-row-top">
              <span className="dish-title-bold">{dishName}</span>
              <span className="status-badge available">{targetStatus}</span>
            </div>
            <div className="availability-row-detail">
              <span>Sucursal</span>
              <span className="font-semibold">{branchName}</span>
            </div>
            <div className="availability-row-detail">
              <span>Nuevo estado</span>
              <span className="font-semibold">{targetStatus}</span>
            </div>
          </div>

          <div className="availability-notice">
            La opción «Agregar» se desactiva para todos los clientes si el platillo está no disponible. Los cambios no alteran pedidos existentes.
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('/management/menu')}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-primary-green"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Actualizando...' : 'Confirmar cambio'}
            </button>
          </div>
        </div>

        {/* Barra inferior de conexiones del prototipo */}
        <div className="prototype-connections-bar">
          <span className="conn-label">Conexiones de esta pantalla:</span>
          <button className="btn-pill-sub" onClick={() => onNavigate('/management/menu')}>Menú</button>
          <button className="btn-pill-sub" onClick={() => alert('Navegando a vista del cliente')}>Vista del cliente</button>
        </div>
      </main>
    </div>
  );
}