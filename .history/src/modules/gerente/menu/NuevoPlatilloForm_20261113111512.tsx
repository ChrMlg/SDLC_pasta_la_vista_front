import React, { useState } from 'react';
import './gerente-menu.css';

export function NuevoPlatilloForm({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MAIN_COURSE');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2 || name.length > 80) {
      setError('El nombre debe tener entre 2 y 80 caracteres.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0.01 || numPrice > 99999.99) {
      setError('El precio debe estar entre $0.01 y $99,999.99.');
      return;
    }
    setError('');
    // Simulación de éxito y retorno al listado
    alert('Platillo registrado con éxito');
    onNavigate('/management/menu');
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Registrar / editar platillo</strong></div>
        <div className="gerente-branch-badge">Centro - Vista de ejemplo</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H1 · MANAGER</span>
          <span className="route-tag">/management/menu/new</span>
        </div>
        
        <h1>Registrar / editar platillo</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">MENÚ · CENTRO</span>
            <h2>Nuevo platillo</h2>
            <p>Los datos se validan antes de guardar.</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="dish-form">
            <div className="form-group">
              <label>Nombre · 2–80 caracteres</label>
              <input 
                type="text" 
                placeholder="Pasta al pesto" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div className="form-group">
              <label>Descripción · máx. 300</label>
              <textarea 
                placeholder="Descripción del platillo" 
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

            <div className="form-group">
              <label>Sucursal autorizada</label>
              <input type="text" value="Centro" disabled className="input-disabled" />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => onNavigate('/management/menu')}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary-green">
                Guardar platillo
              </button>
            </div>
          </form>

          <footer className="form-footer-note">
            Nombre normalizado único por sucursal; cambios auditados con updatedById. No hay borrado físico de platillos.
          </footer>
        </div>
      </main>
    </div>
  );
}