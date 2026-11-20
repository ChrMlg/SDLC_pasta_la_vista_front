import React, { useState } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { createMenuItem } from './gerente-menu-api';
import './gerente-menu.css';

interface NuevoPlatilloProps {
  onNavigate: (path: string) => void;
  defaultBranchId?: string | null;
}

export function NuevoPlatilloForm({ onNavigate, defaultBranchId }: NuevoPlatilloProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || DEFAULT_BRANCH_ID);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MAIN_COURSE');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price.replace(',', '.'));
    if (!name.trim()) {
      setError('El nombre del platillo es obligatorio.');
      return;
    }
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('El precio debe ser un número mayor a 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createMenuItem(branchId, {
        name,
        description,
        category,
        price: numericPrice,
      });
      onNavigate('/management/menu');
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el platillo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header-bar">
        <div className="breadcrumb">
        </div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">

        </div>

        <h1>Registrar nuevo platillo</h1>
        <p className="subtitle-desc">
          El platillo se creará activo (disponible) en la sucursal seleccionada.
        </p>

        <div className="card-menu-panel" style={{ maxWidth: '640px' }}>
          {error && <div className="alert-error-box">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group-menu">
              <label>Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-menu">
              <label>Nombre del platillo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Fettuccine Alfredo"
              />
            </div>

            <div className="form-group-menu">
              <label>Descripción (opcional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredientes o notas del platillo..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group-menu">
                <label>Categoría *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="STARTER">Entrada</option>
                  <option value="MAIN_COURSE">Plato fuerte</option>
                  <option value="DRINK">Bebida</option>
                  <option value="DESSERT">Postre</option>
                </select>
              </div>

              <div className="form-group-menu">
                <label>Precio ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12.50"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate('/management/menu')}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary-green" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar platillo'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}