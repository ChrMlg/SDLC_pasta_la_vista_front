import React, { useState } from 'react';
import { DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { updateItemAvailability } from './gerente-menu-api';
import './gerente-menu.css';

interface ConfirmarDisponibilidadProps {
  branchId?: string;
  itemId?: string;
  dishName?: string;
  currentAvailability?: boolean;
  onNavigate: (path: string) => void;
}

export function ConfirmarDisponibilidad({
  branchId = DEFAULT_BRANCH_ID,
  itemId,
  dishName = 'Platillo seleccionado',
  currentAvailability = true,
  onNavigate,
}: ConfirmarDisponibilidadProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const targetAvailability = !currentAvailability;

  const handleConfirm = async () => {
    if (!itemId) {
      setError('No se recibió el identificador del platillo.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateItemAvailability(branchId, itemId, targetAvailability);
      onNavigate('/management/menu');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la disponibilidad.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header-bar">
        <div className="breadcrumb">
          Gerente / Menú / <strong>Disponibilidad de platillo</strong>
        </div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
        </div>

        <h1>Confirmar cambio de disponibilidad</h1>
        <p className="subtitle-desc">
          Un platillo no disponible no podrá agregarse a nuevos pedidos de mesero o cliente.
        </p>

        <div className="card-menu-panel" style={{ maxWidth: '580px' }}>
          {error && <div className="alert-error-box">{error}</div>}

          <div className="availability-box">
            <div className="availability-row-detail" style={{ marginBottom: '0.75rem' }}>
              <span>Platillo</span>
              <strong>{dishName}</strong>
            </div>
            <div className="availability-row-detail" style={{ marginBottom: '0.75rem' }}>
              <span>Estado actual</span>
              <span className={`status-badge ${currentAvailability ? 'available' : 'unavailable'}`}>
                {currentAvailability ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <div className="availability-row-detail">
              <span>Nuevo estado</span>
              <span className={`status-badge ${targetAvailability ? 'available' : 'unavailable'}`}>
                {targetAvailability ? 'Disponible' : 'No disponible'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
              {submitting
                ? 'Actualizando...'
                : targetAvailability
                ? 'Confirmar activación'
                : 'Confirmar desactivación'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
