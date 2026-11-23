import React, { useState } from 'react';
import { BRANCH_MAP, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { createCustomerOrder } from './cliente-order-api';
import './cliente-order.css';

interface OrderItemInput {
  id: string;
  name: string;
  price: number | string;
  quantity: number;
  notes?: string;
}

interface RevisarPedidoProps {
  onNavigate: (path: string, data?: any) => void;
  orderData?: {
    branchId?: string;
    selectedBranch?: string;
    serviceType?: 'DINE_IN' | 'TAKEAWAY';
    tableNumber?: string;
    tableId?: string | null;
    notes?: string;
    items?: OrderItemInput[];
    subtotal?: number;
  };
}

export function RevisarPedidoApp({ onNavigate, orderData }: RevisarPedidoProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const branchName = orderData?.selectedBranch || 'Centro';
  const branchId = orderData?.branchId || BRANCH_MAP[branchName] || DEFAULT_BRANCH_ID;
  const serviceType = orderData?.serviceType || 'DINE_IN';
  const selectedItems = (orderData?.items || []).filter((item) => item.quantity > 0);
  const subtotal =
    orderData?.subtotal ??
    selectedItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const handleConfirmFinal = async () => {
    if (selectedItems.length === 0) {
      setError('No hay platillos seleccionados en el pedido.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const created = await createCustomerOrder({
        branchId,
        serviceType,
        tableId: serviceType === 'DINE_IN' ? orderData?.tableId ?? null : null,
        items: selectedItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          notes: item.notes || orderData?.notes || undefined,
        })),
      });

      const orderObj = created?.data || created;
      onNavigate('/my-orders', {
        order: orderObj,
        selectedBranch: branchName,
        serviceType,
        tableNumber: orderData?.tableNumber,
        subtotal,
      });
    } catch (err: any) {
      if (err?.code === 'CUSTOMER_TABLE_NOT_ASSIGNED') {
        setError(
          'No tienes una mesa asignada vigente en esta sucursal. Regresa y selecciona tu mesa antes de confirmar.'
        );
      } else {
        setError(err.message || 'No se pudo confirmar el pedido.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Revisar pedido</strong>
        </div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
        </div>

        <h1>Revisar pedido</h1>
        <p className="subtitle-desc">Verifica los detalles antes de confirmar tu orden.</p>

        <div className="card-order-catalog">
          {error && <div className="alert-error-box">{error}</div>}

          <div className="availability-box">
            <div className="availability-row-detail" style={{ marginBottom: '0.5rem' }}>
              <span>Sucursal</span>
              <strong>{branchName}</strong>
            </div>
            <div className="availability-row-detail" style={{ marginBottom: '0.5rem' }}>
              <span>Modalidad</span>
              <strong>{serviceType === 'DINE_IN' ? 'En mesa' : 'Para llevar'}</strong>
            </div>
            {serviceType === 'DINE_IN' && (
              <div className="availability-row-detail">
                <span>Mesa asignada</span>
                <strong>{orderData?.tableNumber || 'Pendiente de asignación'}</strong>
              </div>
            )}
          </div>

          <div className="review-summary-list">
            {selectedItems.length === 0 ? (
              <div className="empty-menu-state">No hay artículos seleccionados.</div>
            ) : (
              selectedItems.map((item) => (
                <div key={item.id} className="review-item-line">
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Cantidad: {item.quantity} × ${Number(item.price).toFixed(2)}
                    </div>
                  </div>
                  <strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong>
                </div>
              ))
            )}
          </div>

          <div className="order-totals-row">
            <span>Total estimado</span>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          <div className="space-between-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('/orders/new')}
              disabled={submitting}
            >
              ← Modificar pedido
            </button>
            <button
              type="button"
              className="btn-primary-green"
              onClick={handleConfirmFinal}
              disabled={submitting || selectedItems.length === 0}
            >
              {submitting ? 'Confirmando pedido...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
