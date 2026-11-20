import React, { useState } from 'react';
import './mesero-tracking.css';
import { WaiterOrderNotification } from './PedidosAvisosMeseroApp';

interface RecogidaEntregaProps {
  onNavigate: (path: string) => void;
  selectedOrder?: WaiterOrderNotification | null;
}

export function RecogidaEntregaApp({ onNavigate, selectedOrder }: RecogidaEntregaProps) {
  // Estados preparados para conectar con PATCH /api/orders/:id/pickup y PATCH /api/orders/:id/deliver
  const [stepStatus, setStepStatus] = useState<'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED'>('READY');

  const handlePickup = () => {
    setStepStatus('OUT_FOR_DELIVERY');
    alert('Pedido marcado como recogido (OUT_FOR_DELIVERY).');
  };

  const handleDeliver = () => {
    if (stepStatus !== 'OUT_FOR_DELIVERY') {
      alert('No puedes confirmar entrega antes de recoger el pedido.');
      return;
    }
    setStepStatus('DELIVERED');
    alert('Entrega al cliente confirmada (DELIVERED).');
  };

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / <strong>Recogida y entrega</strong>
        </div>
      </header>

      <main className="mesero-track-content">
        <div className="meta-info">
          <span className="route-tag">/waiter/orders/:id/delivery</span>
        </div>

        <h1>Recogida y entrega</h1>

        <div className="card-track-panel">
          {!selectedOrder ? (
            /* Estado vacío cuando aún no se ha seleccionado o recibido un pedido */
            <div className="empty-orders-box" style={{ marginBottom: 0 }}>
              <p style={{ margin: '0 0 1rem 0', fontWeight: 500, color: '#334155' }}>
                No hay ningún pedido seleccionado para recogida o entrega en este momento.
              </p>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem' }}>
                Cuando recibas un pedido en estado listo desde tus avisos, aquí aparecerán los pasos de confirmación.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate('/waiter/orders')}
              >
                ← Ir a pedidos y avisos
              </button>
            </div>
          ) : (
            /* Flujo de 3 pasos que se despliega dinámicamente al recibir/seleccionar el pedido */
            <>
              <div className="catalog-header-text">
                <span className="catalog-tag">PEDIDO #{selectedOrder.orderNumber}</span>
                <h2>Confirmar entrega</h2>
                <p>Cada paso tiene su propio estado permitido.</p>
              </div>

              <div className="alert-rule-banner">
                La comanda debe estar en estado READY.
              </div>

              <div className="delivery-steps-list">
                {/* Paso 1 */}
                <div className="delivery-step-card step-done">
                  <div className="step-card-header">
                    <span className="step-card-title">1. Cocina terminó</span>
                    <span className="status-pill ready">READY</span>
                  </div>
                  <p className="step-card-desc">Los platillos están listos para salir.</p>
                </div>

                {/* Paso 2 */}
                <div className={`delivery-step-card ${stepStatus !== 'READY' ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">2. Pedido recogido</span>
                    <span className="status-pill delivery">OUT_FOR_DELIVERY</span>
                  </div>
                  <div className="step-action-row">
                    <button
                      type="button"
                      className="btn-primary-green"
                      onClick={handlePickup}
                      disabled={stepStatus !== 'READY'}
                    >
                      Recoger pedido
                    </button>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className={`delivery-step-card ${stepStatus === 'DELIVERED' ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">3. Entrega al cliente</span>
                    <span className="status-pill ready">DELIVERED</span>
                  </div>
                  <div className="step-action-row">
                    <button
                      type="button"
                      className="btn-primary-green"
                      onClick={handleDeliver}
                      disabled={stepStatus !== 'OUT_FOR_DELIVERY'}
                    >
                      Confirmar entrega
                    </button>
                  </div>
                </div>
              </div>

              <div className="footer-rule-text">
                No puedes confirmar entrega antes de recoger. Se registra quién recogió, quién entregó y la fecha.
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
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