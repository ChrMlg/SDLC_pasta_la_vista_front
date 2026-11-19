import React, { useState } from 'react';
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
    tableId?: string;
    notes?: string;
    items?: OrderItemInput[];
    subtotal?: number;
  };
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambu: 'a2222222-2222-4222-8222-222222222222',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

const CENTRO_TABLES_BY_LABEL: Record<string, string> = {
  'Mesa 01': '857ca5dd-6791-4433-865b-9f2099bc46ab',
  'Mesa 02': 'de41d979-9cfa-4684-8133-690aec5ea465',
  'Mesa 03': '7c116ead-c586-4efd-bbf3-eb5fb7aae8d9',
  'Mesa 04': 'f92ea75b-84c7-4ccf-9485-191dff715ca3',
  'Mesa 05': '1eede6c2-acac-4d3c-9e4c-f18e63f897e0',
  'Mesa 06': 'b9cdff2a-fe14-46db-ab17-cff08fa49be1',
  'Mesa 07': 'edc64558-10c0-4c41-90b4-2e296228057a',
  'Mesa 08': '03a4e032-5e02-417e-96b2-c7fae77ebf55',
  'Mesa 09': '05377e11-ddd2-42ce-89a6-ade74db0dfcc',
  'Mesa 10': 'cc7ead4b-811b-4275-8db0-3f84df3d50e9',
  'Mesa 11': '2bac81d1-25bf-41f2-8b7f-49d257cd5bce',
  'Mesa 12': '0fa5dc1b-0b9c-45bc-a3b8-0d321902632f',
};

export function RevisarPedidoApp({ onNavigate, orderData }: RevisarPedidoProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const branchName = orderData?.selectedBranch || 'Centro';
  const branchId = orderData?.branchId || BRANCH_MAP[branchName] || 'a1111111-1111-4111-8111-111111111111';
  const serviceType = orderData?.serviceType || 'DINE_IN';
  const serviceLabel = serviceType === 'TAKEAWAY' ? 'Para llevar' : 'Pedido en mesa';

  const selectedItems = (orderData?.items || []).filter((item) => item.quantity > 0);
  const subtotal =
    orderData?.subtotal ??
    selectedItems.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  const resolveTableId = async (): Promise<string | null> => {
    if (serviceType !== 'DINE_IN') return null;
    if (orderData?.tableId) return orderData.tableId;
    if (orderData?.tableNumber && CENTRO_TABLES_BY_LABEL[orderData.tableNumber]) {
      return CENTRO_TABLES_BY_LABEL[orderData.tableNumber];
    }

    // Si es otra sucursal, buscamos la mesa por número en /api/branches/:branchId/tables
    const tablesRes = await fetch(`/api/branches/${branchId}/tables`, {
      credentials: 'include',
    });
    if (!tablesRes.ok) return null;

    const tables = await tablesRes.json();
    const list = Array.isArray(tables) ? tables : tables.data || [];
    const targetNum = Number((orderData?.tableNumber || '1').replace(/\D/g, '')) || 1;
    const found = list.find((t: any) => Number(t.number) === targetNum) || list[0];
    return found?.id || null;
  };

  const handleConfirmFinal = async () => {
    if (selectedItems.length === 0) {
      setError('No hay platillos seleccionados en el pedido.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let resolvedTableId: string | null = null;

      // Como es cliente (CUSTOMER), si es DINE_IN primero selecciona/activa la mesa en el backend
      if (serviceType === 'DINE_IN') {
        resolvedTableId = await resolveTableId();
        if (!resolvedTableId) {
          throw new Error('No se encontró un identificador de mesa válido para esta sucursal.');
        }

        const selectRes = await fetch(
          `/api/branches/${branchId}/tables/${resolvedTableId}/select`,
          {
            method: 'POST',
            credentials: 'include',
          }
        );

        if (!selectRes.ok) {
          const errSel = await selectRes.json().catch(() => ({}));
          throw new Error(errSel.message || 'No se pudo activar la mesa seleccionada.');
        }
      }

      // Envía el pedido con el formato exacto validado por el DTO de NestJS
      const apiBody: Record<string, unknown> = {
        branchId,
        type: serviceType,
        items: selectedItems.map((item) => ({
          dishId: item.id,
          quantity: item.quantity,
          ...(item.notes || orderData?.notes
            ? { notes: item.notes || orderData?.notes }
            : {}),
        })),
      };

      if (serviceType === 'DINE_IN' && resolvedTableId) {
        apiBody.tableId = resolvedTableId;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message)
          ? errData.message.join(', ')
          : errData.message;
        throw new Error(msg || 'Error al registrar el pedido en el servidor.');
      }

      const createdOrder = await res.json();

      onNavigate('/orders/created', {
        order: createdOrder,
        selectedBranch: branchName,
        serviceType,
        tableNumber: orderData?.tableNumber,
        subtotal,
      });
    } catch (err: any) {
      setError(err.message || 'No se pudo confirmar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Revisar y confirmar pedido</strong>
        </div>
        <div className="branch-badge">{branchName} · Conectado al Back</div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H4 + H5 · CUSTOMER</span>
          <span className="route-tag">/orders/review</span>
        </div>

        <h1>Revisar y confirmar pedido</h1>
        <p className="subtitle-desc">
          Pantalla individual · Comprueba los datos antes de enviar al servidor
        </p>

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">PASO 02 DE 02</span>
            <h2>Confirma los detalles</h2>
            <p>Comprueba cantidades, notas y tipo de servicio antes de enviar.</p>
          </div>

          {error && (
            <div
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <div className="availability-box">
            <div className="availability-row-top">
              <span className="dish-title-bold">
                {serviceLabel}
                {serviceType === 'DINE_IN' && orderData?.tableNumber
                  ? ` · ${orderData.tableNumber}`
                  : ''}
              </span>
              <span className="status-badge available">{branchName}</span>
            </div>

            {selectedItems.length > 0 ? (
              <div style={{ margin: '0.75rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0',
                      fontSize: '0.92rem',
                      color: '#334155',
                    }}
                  >
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                No hay platillos cargados para revisar.
              </p>
            )}

            <div className="availability-row-detail">
              <span>Total sin IVA</span>
              <span className="font-semibold text-amount-lg">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="availability-notice">
            Al registrar un pedido en mesa, se crea la comanda de Cocina. Para llevar, se espera un pago aprobado.
          </div>

          <div className="form-actions space-between-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('/orders/new')}
              disabled={submitting}
            >
              ← Editar
            </button>
            <button
              type="button"
              className="btn-primary-green"
              onClick={handleConfirmFinal}
              disabled={submitting}
            >
              {submitting ? 'Confirmando pedido...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}