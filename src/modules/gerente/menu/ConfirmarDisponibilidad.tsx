import React, { useState } from 'react';
import { updateItemAvailability } from './gerente-menu-api';
import './gerente-menu.css';

interface ConfirmarDisponibilidadProps {
  onNavigate: (path: string, params?: any) => void;
  branchId: string;
  itemId: string;
  dishName: string;
  currentAvailability: boolean;
}

export function ConfirmarDisponibilidad({ 
  onNavigate, 
  branchId, 
  itemId, 
  dishName, 
  currentAvailability 
}: ConfirmarDisponibilidadProps) {
  // El nuevo estado será el opuesto al actual
  const targetStatus = !currentAvailability;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Llamada real al backend para cambiar la disponibilidad
      await updateItemAvailability(branchId, itemId, targetStatus);
      sessionStorage.setItem('menuNotice', 'Disponibilidad actualizada');
      onNavigate('/management/menu');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la disponibilidad');
      setSubmitting(false);
    }
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Confirmar disponibilidad</strong></div>
        <div className="gerente-branch-badge">Centro - Conectado al Back</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H2 · MANAGER</span>
          <span className="route-tag">/management/menu/:id/availability</span>
        </div>
        
        <h1>Confirmar disponibilidad</h1>
        <p className="subtitle-desc">Pantalla de confirmación para cambiar el estado de disponibilidad del producto.</p>

        <div className="card-catalog availability-card-wrapper">
          <div className="catalog-header-text">
            <span className="catalog-tag">DISPONIBILIDAD</span>
            <h2>¿Confirmar cambio?</h2>
            <p>Estás a punto de cambiar el estado de disponibilidad de este platillo.</p>
          </div>

          {error && <div className="alert-error" style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

          {/* Tarjeta interna de detalle */}
          <div className="availability-box">
            <div className="availability-row-top">
              <span className="dish-title-bold" style={{ fontWeight: 'bold' }}>{dishName}</span>
              <span className={`status-badge ${targetStatus ? 'available' : 'unavailable'}`} style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                background: targetStatus ? '#064e3b' : '#7f1d1d',
                color: targetStatus ? '#34d399' : '#fca5a5'
              }}>
                {targetStatus ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <div className="availability-row-detail" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              <span>Sucursal</span>
              <span className="font-semibold">Centro</span>
            </div>
            <div className="availability-row-detail" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span>Nuevo estado</span>
              <span className="font-semibold" style={{ color: targetStatus ? '#34d399' : '#fca5a5' }}>
                {targetStatus ? 'Disponible' : 'No disponible'}
              </span>
            </div>
          </div>

          <div className="availability-notice" style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '1rem 0' }}>
            La opción «Agregar» se desactiva para todos los clientes si el platillo está no disponible. Los cambios no alteran pedidos existentes.
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('/management/menu')}
              disabled={submitting}
              style={{ padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn-primary-green"
              onClick={handleConfirm}
              disabled={submitting}
              style={{ padding: '0.5rem 1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {submitting ? 'Actualizando...' : 'Confirmar cambio'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}