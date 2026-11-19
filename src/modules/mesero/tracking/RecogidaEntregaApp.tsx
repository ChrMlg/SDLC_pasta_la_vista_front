import React, { useState, useEffect } from 'react';
import './mesero-tracking.css';
import { WaiterOrderNotification } from './PedidosAvisosMeseroApp';

interface RecogidaEntregaProps {
  onNavigate: (path: string) => void;
  selectedOrder?: WaiterOrderNotification | null;
}

export function RecogidaEntregaApp({
  onNavigate,
  selectedOrder,
}: RecogidaEntregaProps) {
  const [stepStatus, setStepStatus] = useState<'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED'>('READY');

  useEffect(() => {
    if (selectedOrder?.status === 'OUT_FOR_DELIVERY' || selectedOrder?.status === 'DELIVERED') {
      setStepStatus(selectedOrder.status);
    } else {
      setStepStatus('READY');
    }
  }, [selectedOrder]);

  const handlePickup = () => {
    if (!selectedOrder) return;
    setStepStatus('OUT_FOR_DELIVERY');
  };

  const handleDeliver = () => {
    if (!selectedOrder || stepStatus !== 'OUT_FOR_DELIVERY') return;
    setStepStatus('DELIVERED');
  };

  return (
    <div className="mesero-track-container">
      <header className="mesero-track-header">
        <div className="breadcrumb">
          Mesero / <strong>Recogida y entrega</strong>
        </div>
        <span className="branch-badge">H9 · WAITER</span>
      </header>

      <main className="mesero-track-content">
        <h1>Recogida y entrega</h1>
        <p className="subtitle-desc">
          Confirmación secuencial de recogida y entrega al cliente.
        </p>

        <div className="card-track-panel">
          {!selectedOrder ? (
            <div className="empty-orders-box">
              <p className="step-card-title">
                No hay ningún pedido seleccionado para recogida o entrega en este momento.
              </p>
              <p className="step-card-desc">
                Cuando recibas o selecciones un pedido listo desde tus avisos, aquí aparecerán los pasos.
              </p>
              <div className="step-action-row">
                <button
                  type="button"
                  className="btn-cocina btn-secondary"
                  onClick={() => onNavigate('/waiter/orders')}
                >
                  ← Ir a pedidos y avisos
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className="catalog-tag">PEDIDO #{selectedOrder.orderNumber}</span>
                <h2 className="panel-title">Confirmar entrega</h2>
                <p className="panel-subtitle">Cada paso tiene su propio estado permitido.</p>
              </div>

              <div className="alert-rule-banner">
                La comanda debe estar en estado READY.
              </div>

              <div className="delivery-steps-list">
                <div className="delivery-step-card step-done">
                  <div className="step-card-header">
                    <span className="step-card-title">1. Cocina terminó</span>
                    <span className="status-pill ready">READY</span>
                  </div>
                  <p className="step-card-desc">Los platillos están listos para salir.</p>
                </div>

                <div className={`delivery-step-card ${stepStatus !== 'READY' ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">2. Pedido recogido</span>
                    <span className="status-pill delivery">OUT_FOR_DELIVERY</span>
                  </div>
                  <div className="step-action-row">
                    <button
                      type="button"
                      className="btn-cocina btn-primary"
                      onClick={handlePickup}
                      disabled={stepStatus !== 'READY'}
                    >
                      Recoger pedido
                    </button>
                  </div>
                </div>

                <div className={`delivery-step-card ${stepStatus === 'DELIVERED' ? 'step-done' : ''}`}>
                  <div className="step-card-header">
                    <span className="step-card-title">3. Entrega al cliente</span>
                    <span className="status-pill ready">DELIVERED</span>
                  </div>
                  <div className="step-action-row">
                    <button
                      type="button"
                      className="btn-cocina btn-primary"
                      onClick={handleDeliver}
                      disabled={stepStatus !== 'OUT_FOR_DELIVERY'}
                    >
                      Confirmar entrega
                    </button>
                  </div>
                </div>
              </div>

              <p className="footer-rule-text">
                No puedes confirmar entrega antes de recoger. Se registra quién recogió, quién entregó y la fecha.
              </p>

              <div className="track-footer-actions">
                <button
                  type="button"
                  className="btn-cocina btn-secondary"
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