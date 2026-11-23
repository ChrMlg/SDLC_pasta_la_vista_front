import React, { useState, useEffect } from 'react';
import {
  updateWaiterOrderStatus,
  WaiterOrderTrackingItem,
} from './mesero-tracking-api';
import './mesero-tracking.css';

interface RetirarEntregaProps {
  onNavigate: (path: string) => void;
  selectedOrder?: WaiterOrderTrackingItem | null;
}

export function RetirarEntregaApp({ onNavigate, selectedOrder }: RetirarEntregaProps) {
  const [status, setStatus] = useState(selectedOrder?.status || 'READY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(selectedOrder?.status || 'READY');
    setError('');
  }, [selectedOrder]);

  const isKitchenReady = ['READY', 'PICKED_UP', 'DELIVERED'].includes(status);
  const isPickedUp = ['PICKED_UP', 'DELIVERED'].includes(status);
  const isDelivered = status === 'DELIVERED';
  const statusLabels: Record<string, string> = {
    READY: 'Listo',
    PICKED_UP: 'Recogido',
    DELIVERED: 'Entregado',
  };

  const handleConfirmPickup = async () => {
    if (!selectedOrder) return;
    if (!isKitchenReady) {
      setError('La comanda debe estar lista en cocina antes de retirarla.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateWaiterOrderStatus(selectedOrder.id, 'PICKED_UP');
      setStatus('PICKED_UP');
    } catch (err: any) {
      setError(err.message || 'No se pudo confirmar retirar pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    if (!isPickedUp) {
      setError('Debes confirmar el pedido recogido antes de marcarlo como entregado.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await updateWaiterOrderStatus(selectedOrder.id, 'DELIVERED');
      setStatus('DELIVERED');
    } catch (err: any) {
      setError(err.message || 'No se pudo confirmar la entrega al cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / Seguimiento / <strong>Retirar y entrega</strong>
        </div>
      </header>

      <main className="mesero-track-content">
        <div className="meta-info">
          <span className="badge-h">Entregas</span>
          <span className="route-tag">/waiter/orders/:id/delivery</span>
        </div>

        <h1>Confirmación de retirar y entrega</h1>
        <p className="subtitle-desc">
          Flujo secuencial: 1. Cocina terminó → 2. Pedido recogido → 3. Entregado al cliente.
        </p>

        <div className="card-track-panel">
          {error && (
            <div
              className="alert-error"
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {!selectedOrder ? (
            <div className="empty-orders-box">
              No hay ningún pedido seleccionado para retirar o entrega en este momento.
              <div className="step-action-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate('/waiter/orders')}
                >
                  ← Volver a seguimiento de pedidos
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="order-track-top" style={{ marginBottom: '1rem' }}>
                <div>
                  <span className="catalog-tag">ENTREGA EN SERVICIO</span>
                  <h2 style={{ margin: '0.2rem 0' }}>
                    Pedido{' '}
                    {selectedOrder.orderNumber
                      ? `#${selectedOrder.orderNumber}`
                      : `#${selectedOrder.id.slice(0, 6).toUpperCase()}`}
                  </h2>
                </div>
                <span className="status-pill ready">{statusLabels[status] ?? 'Estado desconocido'}</span>
              </div>

              <div className="delivery-steps-list">
                <div className={`delivery-step-card ${isKitchenReady ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">1. Cocina terminó</span>
                    <span className="status-pill ready">Listo</span>
                  </div>
                  <p className="step-card-desc">
                    {isKitchenReady
                      ? 'Comanda lista en la barra de cocina.'
                      : 'Aún en preparación en cocina.'}
                  </p>
                </div>

                <div className={`delivery-step-card ${isPickedUp ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">2. Pedido recogido</span>
                    <span className="status-pill delivery">Recogido</span>
                  </div>
                  <p className="step-card-desc">
                    El mesero retira los platillos listos de cocina.
                  </p>
                  {!isPickedUp && (
                    <div className="step-action-row">
                      <button
                        type="button"
                        className="btn-primary-green"
                        disabled={!isKitchenReady || submitting}
                        onClick={handleConfirmPickup}
                      >
                        {submitting ? 'Confirmando...' : 'Confirmar retirar pedido'}
                      </button>
                    </div>
                  )}
                </div>

                <div className={`delivery-step-card ${isDelivered ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">3. Entrega al cliente</span>
                    <span className="status-pill ready">Entregado</span>
                  </div>
                  <p className="step-card-desc">
                    Entrega final en mesa o retiro en mostrador.
                  </p>
                  {!isDelivered && (
                    <div className="step-action-row">
                      <button
                        type="button"
                        className="btn-primary-green"
                        disabled={!isPickedUp || submitting}
                        onClick={handleConfirmDelivery}
                      >
                        {submitting ? 'Confirmando...' : 'Confirmar entrega'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="track-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onNavigate('/waiter/orders')}
                >
                  ← Volver a pedidos y avisos
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}