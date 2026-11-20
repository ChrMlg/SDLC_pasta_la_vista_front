import { useRef, useState, type FormEvent } from 'react';
import type { InventoryItem } from './inventory-api';
import {
  createMovement,
  type InventoryMovementApiError,
  type InventoryMovementType,
} from './inventory-movements-api';
import './inventory-movements.css';

type Field = 'itemId' | 'type' | 'quantity' | 'reason';
type FieldErrors = Partial<Record<Field, string>>;

function isField(value: string | null | undefined): value is Field {
  return value === 'itemId' || value === 'type' || value === 'quantity' || value === 'reason';
}

function isMovementApiError(error: unknown): error is InventoryMovementApiError {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && typeof error.code === 'string'
    && 'message' in error && typeof error.message === 'string'
    && 'field' in error && (typeof error.field === 'string' || error.field === null)
    && 'status' in error && typeof error.status === 'number';
}

export function MovementForm({ branchId, items, onSaved }: {
  branchId: string;
  items: InventoryItem[];
  onSaved: () => void | Promise<void>;
}) {
  const [itemId, setItemId] = useState('');
  const [type, setType] = useState<InventoryMovementType | ''>('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const selectedItem = items.find(item => item.id === itemId);

  function clearFieldError(field: Field) {
    setFieldErrors(current => ({ ...current, [field]: undefined }));
    setError('');
    setNotice('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || items.length === 0) return;

    const nextErrors: FieldErrors = {};
    if (!itemId || !selectedItem) nextErrors.itemId = 'Seleccione un insumo';
    if (!type) nextErrors.type = 'Seleccione un tipo de movimiento';
    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 2147483647) {
      nextErrors.quantity = 'Ingrese una cantidad entera mayor a cero';
    } else if (type === 'OUT' && selectedItem && parsedQuantity > selectedItem.currentStock) {
      nextErrors.quantity = 'Stock insuficiente para esta salida.';
    }
    if (!reason.trim() || reason.trim().length > 200) {
      nextErrors.reason = 'Ingrese un motivo de 1 a 200 caracteres';
    }
    setFieldErrors(nextErrors);
    setError('');
    setNotice('');
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedItem || !type) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await createMovement({
        branchId,
        itemId,
        quantity: parsedQuantity,
        type,
        reason: reason.trim(),
      });
      setItemId('');
      setType('');
      setQuantity('');
      setReason('');
      setFieldErrors({});
      setNotice('Movimiento registrado');
      await onSaved();
    } catch (cause: unknown) {
      const apiError = isMovementApiError(cause) ? cause : null;
      if (apiError?.status === 400 && apiError.code === 'INVALID_FIELD' && isField(apiError.field)) {
        setFieldErrors({ [apiError.field]: apiError.message ?? 'Revise este campo' });
      } else if (apiError?.status === 400 && apiError.code === 'INSUFFICIENT_STOCK') {
        setFieldErrors({ quantity: 'Stock insuficiente para esta salida.' });
      } else if (apiError?.status === 404) {
        setError('No se encontró el insumo o la sucursal.');
        await onSaved();
      } else if (apiError?.status === 403) {
        setError('No tiene permiso para registrar movimientos.');
      } else if (apiError?.status === 401) {
        setError('Inicie sesión para continuar.');
      } else {
        setError('No se pudo registrar el movimiento. Intente de nuevo.');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return <section className="movementFormSection" aria-labelledby="movement-form-title">
    <h2 id="movement-form-title">Registrar movimiento</h2>
    {notice && <p className="movementNotice" role="status">{notice}</p>}
    {error && <p className="movementError" role="alert">{error}</p>}
    {items.length === 0
      ? <p className="movementEmpty">No hay insumos para registrar movimientos.</p>
      : <form className="movementForm" onSubmit={submit} noValidate>
        <label>
          Insumo
          <select value={itemId} disabled={submitting} onChange={event => {
            setItemId(event.target.value);
            clearFieldError('itemId');
            clearFieldError('quantity');
          }} aria-invalid={Boolean(fieldErrors.itemId)} aria-describedby={fieldErrors.itemId ? 'movement-item-error' : undefined} required>
            <option value="">Seleccione un insumo</option>
            {items.map(item => <option key={item.id} value={item.id}>
              {item.name} — {item.currentStock} {item.unit}
            </option>)}
          </select>
          {fieldErrors.itemId && <small id="movement-item-error" className="movementFieldError" role="alert">{fieldErrors.itemId}</small>}
        </label>

        <label>
          Tipo
          <select value={type} disabled={submitting} onChange={event => {
            const value = event.target.value;
            setType(value === 'IN' || value === 'OUT' ? value : '');
            clearFieldError('type');
            clearFieldError('quantity');
          }} aria-invalid={Boolean(fieldErrors.type)} aria-describedby={fieldErrors.type ? 'movement-type-error' : undefined} required>
            <option value="">Seleccione el tipo</option>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
          </select>
          {fieldErrors.type && <small id="movement-type-error" className="movementFieldError" role="alert">{fieldErrors.type}</small>}
        </label>

        <label>
          Cantidad
          <input type="number" min="1" max="2147483647" step="1" inputMode="numeric" value={quantity}
            disabled={submitting} onChange={event => {
              setQuantity(event.target.value);
              clearFieldError('quantity');
            }} aria-invalid={Boolean(fieldErrors.quantity)}
            aria-describedby={fieldErrors.quantity ? 'movement-quantity-error' : undefined} required />
          {fieldErrors.quantity && <small id="movement-quantity-error" className="movementFieldError" role="alert">{fieldErrors.quantity}</small>}
        </label>

        <label className="movementReasonField">
          Motivo
          <textarea maxLength={200} value={reason} disabled={submitting} onChange={event => {
            setReason(event.target.value);
            clearFieldError('reason');
          }} aria-invalid={Boolean(fieldErrors.reason)}
            aria-describedby={`movement-reason-count${fieldErrors.reason ? ' movement-reason-error' : ''}`} required />
          <small id="movement-reason-count" className="movementReasonCount">{reason.length}/200</small>
          {fieldErrors.reason && <small id="movement-reason-error" className="movementFieldError" role="alert">{fieldErrors.reason}</small>}
        </label>

        <button className="movementSubmit" type="submit" disabled={submitting || items.length === 0}>
          {submitting ? 'Registrando…' : 'Registrar movimiento'}
        </button>
      </form>}
  </section>;
}
