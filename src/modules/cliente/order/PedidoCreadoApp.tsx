import React from 'react';
import { COMPANION_ROUTES } from '../../../shared/module-bridges';
import './cliente-order.css';

interface PedidoCreadoProps {
  onNavigate: (path: string) => void;
  createdData?: {
    order?: any;
    selectedBranch?: string;
    serviceType?: 'DINE_IN' | 'TAKEAWAY';
    tableNumber?: string;
    subtotal?: number;
  };
}

export function PedidoCreadoApp({ onNavigate, createdData }: PedidoCreadoProps) {
  const order = createdData?.order || {};
  const branchName = createdData?.selectedBranch || 'Centro';
  const serviceType = order.type || createdData?.serviceType || 'DINE_IN';
  const isDineIn = serviceType === 'DINE_IN';

  const orderCode =
    order.orderNumber ||
    order.code ||
    (order.id ? `#${String(order.id).slice(0, 6).toUpperCase()}` : '#0107');

  const statusRaw = order.status || 'PENDING';
  const statusLabel = statusRaw === 'PENDING' ? 'Pendiente · PENDING' : statusRaw;

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Pedido creado</strong>
        </div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">

        </div>

        <h1>Pedido creado</h1>
        <p className="subtitle-desc">Confirmación del registro en el sistema</p>

        <div className="card-order-catalog" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <span className="status-badge available">PEDIDO REGISTRADO</span>
          </div>

          <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0' }}>
            Pedido {String(orderCode).startsWith('#') ? orderCode : `#${orderCode}`}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>Estado: {statusLabel}</p>

          <div className="availability-box" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <div className="availability-row-detail" style={{ marginBottom: '0.5rem' }}>
              <span>Sucursal</span>
              <strong>{branchName}</strong>
            </div>
            <div className="availability-row-detail" style={{ marginBottom: '0.5rem' }}>
              <span>Tipo</span>
              <strong>{isDineIn ? 'En mesa' : 'Para llevar'}</strong>
            </div>
            <div className="availability-row-detail">
              <span>Flujo operativo</span>
              <strong>
                {isDineIn
                  ? 'Comanda enviada a Cocina (Módulo 3)'
                  : 'Pendiente de pago (PAID) en Módulo 6 para entrar a Cocina'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isDineIn && (
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => onNavigate(COMPANION_ROUTES.billingCheckoutRoute(order.id))}
              >
                Pagar pedido
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('/notifications')}
            >
              Ver notificaciones
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('/orders/new')}
            >
              Hacer otro pedido
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
