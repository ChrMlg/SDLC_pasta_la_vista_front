import React from 'react';
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
        <div className="branch-badge">{branchName} · Conectado al Back</div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H5 · CUSTOMER</span>
          <span className="route-tag">/my-orders</span>
        </div>

        <h1>Pedido creado</h1>
        <p className="subtitle-desc">
          Confirmación del registro en el sistema
        </p>

        <div className="card-order-catalog" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <span
              className="status-badge available"
              style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}
            >
              PEDIDO REGISTRADO
            </span>
          </div>

          <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0' }}>
            Pedido {String(orderCode).startsWith('#') ? orderCode : `#${orderCode}`}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>
            Estado: {statusLabel}
          </p>

          <div
            style={{
              background: '#e6ebe0',
              borderRadius: '8px',
              padding: '1.1rem',
              marginBottom: '1rem',
              color: '#1b4332',
              fontSize: '1.25rem',
              fontWeight: 'bold',
            }}
          >
            ✓
          </div>

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
              <span>Envío a Cocina</span>
              <strong>
                {isDineIn ? 'Comanda creada' : 'En espera de pago (PAID)'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
            onClick={() => onNavigate('/orders/new')}
          >
            Ver mis pedidos / Volver al menú
          </button>
        </div>
      </main>
    </div>
  );
}