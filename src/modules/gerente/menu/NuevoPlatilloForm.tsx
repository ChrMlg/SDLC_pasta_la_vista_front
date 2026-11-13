import React, { useState } from 'react';
import { createMenuItem } from './gerente-menu-api';
import './gerente-menu.css';

const CENTRO_BRANCH_ID = 'uuid-sucursal-centro-aqui';

export function NuevoPlatilloForm({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MAIN_COURSE');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await createMenuItem(CENTRO_BRANCH_ID, {
        name,
        description: description.trim() || undefined,
        category,
        price,
      });

      alert('Platillo registrado con éxito');
      onNavigate('/management/menu');
    } catch (err: any) {
      // Manejo de errores devueltos por el backend (ej. 409 duplicado, 400 validación)
      setError(err.message || 'No se pudo guardar el platillo en el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Registrar platillo</strong></div>
        <div className="gerente-branch-badge">Centro - Conectado al Back</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H1 · MANAGER</span>
          <span className="route-tag">/management/menu/new</span>
        </div>
        
        <h1>Registrar platillo</h1>
        <p className="subtitle-desc">El servidor validará las restricciones de nombre único y formato.</p>

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">MENÚ · CENTRO</span>
            <h2>Nuevo platillo</h2>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="dish-form">
            <div className="form-group">
              <label>Nombre · 2–80 caracteres</label>
              <input 
                type="text" 
                placeholder="Ej. Pollo al horno" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción · máx. 300</label>
              <textarea 
                placeholder="Descripción opcional" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="STARTER">Entrada</option>
                  <option value="MAIN_COURSE">Plato fuerte</option>
                  <option value="DRINK">Bebida</option>
                  <option value="DESSERT">Postre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Precio USD · 0.01–99,999.99</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="12.50" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
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