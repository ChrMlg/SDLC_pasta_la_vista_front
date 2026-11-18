import React, { useState } from 'react';
import { createMenuItem } from './gerente-menu-api';
import './gerente-menu.css'; 

interface NuevoPlatilloFormProps {
  onNavigate: (path: string) => void;
}

export function NuevoPlatilloForm({ onNavigate }: NuevoPlatilloFormProps) {
  // ID fijo de la sucursal Centro
  const branchId = 'a1111111-1111-4111-8111-111111111111';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MAIN_COURSE'); 
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Valida y envía los datos del formulario al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numericPrice = parseFloat(String(price).replace(',', '.'));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Por favor, ingresa un precio válido mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await createMenuItem(branchId, {
        name,
        description: description.trim() || undefined,
        category,
        price: numericPrice,
      });

      setSuccess('¡Platillo registrado con éxito!');
      setName('');
      setDescription('');
      setPrice('');
      
      // Redirige al listado del menú tras un breve momento
      setTimeout(() => {
        onNavigate('/management/menu');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error al registrar el platillo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Registrar platillo</strong></div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="route-tag">/management/menu/new</span>
        </div>
        
        <h1>Registrar platillo</h1>

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">MENÚ · CENTRO</span>
            <h2>Nuevo platillo</h2>
          </div>

          {error && <div className="alert-error" style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ background: '#059669', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>{success}</div>}

          <form onSubmit={handleSubmit} className="dish-form">
            <div className="form-group">
              <label>Nombre · 2–80 caracteres</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                maxLength={80}
                required 
              />
            </div>

            <div className="form-group">
              <label>Descripción · máx. 300</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                maxLength={300}
                rows={3}
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Categoría</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="MAIN_COURSE">Plato fuerte</option>
                  <option value="STARTER">Entrada</option>
                  <option value="DRINK">Bebida</option>
                  <option value="DESSERT">Postre</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Precio USD · 0.01–99,999.99</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                  placeholder="85.00"
                />
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => onNavigate('/management/menu')}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-primary-green"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar platillo'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}