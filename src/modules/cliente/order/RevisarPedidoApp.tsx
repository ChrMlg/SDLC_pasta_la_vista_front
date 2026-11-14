import React from 'react';
import './cliente-order.css';

interface RevisarPedidoProps {
  onNavigate: (path: string) => void;
  orderData?: {
    selectedBranch: string;
    serviceType: string;
    tableNumber: string;
    items: any[];
    subtotal: number;
  };
}

export function RevisarPedidoApp({ onNavigate, orderData }: RevisarPedidoProps) {
  const branchName = orderData?.selectedBranch || 'Centro';
  const serviceLabel = orderData?.serviceType === 'TAKEAWAY' ? 'Para llevar' : `Pedido en mesa (${orderData?.tableNumber || 'Mesa 04'})`;
  const subtotal = orderData?.subtotal || 0;

  const handleConfirmFinal = () => {
    alert(`¡Pedido confirmado con éxito en sucursal ${branchName}! Enviado a cocina.`);
    onNavigate('/orders/new');
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">Cliente / <strong>Revisar y confirmar pedido</strong></div>
        <div className="branch-badge">{branchName} · Vista de ejemplo</div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H4 + H5 · CUSTOMER</span>
          <span className="route-tag">/orders/review</span>
        </div>

        <h1>Revisar y confirmar pedido</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">PASO 02 DE 02</span>
            <h2>Confirma los detalles</h2>
            <p>Comprueba cantidades, notas y tipo de servicio antes de enviar.</p>
          </div>

          <div className="availability-box">
            <div className="availability-row-top">
              <span className="dish-title-bold">{serviceLabel}</span>
              <span className="status-badge available">{branchName}</span>
            </div>
            <div className="availability-row-detail">
              <span>Total sin IVA</span>
              <span className="font-semibold text-amount-lg">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="availability-notice">
            Al registrar un pedido en mesa en la sucursal <strong>{branchName}</strong>, se crea la comanda de Cocina. Para llevar, se espera un pago aprobado.
          </div>

          <div className="form-actions space-between-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => onNavigate('/orders/new')}
            >
              ← Editar
            </button>
            <button 
              type="button" 
              className="btn-primary-green"
              onClick={handleConfirmFinal}
            >
              Confirmar pedido
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}