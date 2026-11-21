import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { ClientMenuItem, fetchAllClientMenuItems } from './cliente-menu-api';
import './cliente-menu.css';

export function ClienteMenuApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [branchId, setBranchId] = useState(DEFAULT_BRANCH_ID);
  const [items, setItems] = useState<ClientMenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await fetchAllClientMenuItems(branchId);
      setItems(list);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el menú digital.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [branchId]);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      STARTER: 'Entrada',
      MAIN_COURSE: 'Plato fuerte',
      DRINK: 'Bebida',
      DESSERT: 'Postre',
    };
    return map[cat] || cat;
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const catLabel = getCategoryLabel(item.category);
    const matchesTab =
      activeTab === 'Todos' ||
      (activeTab === 'Entradas' && catLabel === 'Entrada') ||
      (activeTab === 'Platos fuertes' && catLabel === 'Plato fuerte') ||
      (activeTab === 'Bebidas' && catLabel === 'Bebida') ||
      (activeTab === 'Postres' && catLabel === 'Postre');
    return matchesSearch && matchesTab;
  });

  const branchLabel = BRANCHES.find((b) => b.id === branchId)?.label || 'Centro';

  return (
    <div className="cliente-menu-container">
      <header className="cliente-menu-header">
        <div className="breadcrumb">
          Cliente / <strong>Menú digital</strong>
        </div>
      </header>

      <main className="cliente-menu-content">
        <div className="meta-info">
        </div>

        <h1>Menú digital</h1>
        <p className="subtitle-desc">
          Consulta los platillos y disponibilidad por sucursal en tiempo real.
        </p>

        <div className="menu-catalog-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <span className="catalog-tag">CATÁLOGO PÚBLICO</span>
              <h2 style={{ margin: '0.2rem 0' }}>Carta de {branchLabel}</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button type="button" className="btn-secondary" onClick={loadMenu}>
                Actualizar menú
              </button>
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => onNavigate('/orders/new')}
              >
              </button>
            </div>
          </div>

          {error && <div className="alert-error-box">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
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
              <label>Buscar platillo</label>
              <input
                type="text"
                placeholder="Buscar en la carta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Todos', 'Entradas', 'Platos fuertes', 'Bebidas', 'Postres'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'btn-primary-green' : 'btn-secondary'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-state-menu">Cargando menú de la sucursal...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state-menu">No hay platillos que coincidan con la búsqueda.</div>
          ) : (
            <div className="menu-dishes-grid">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`dish-card ${!item.isAvailable ? 'unavailable' : ''}`}
                >
                  <div>
                    <div className="dish-card-top">
                      <h3>{item.name}</h3>
                      <span
                        className={`status-badge ${
                          item.isAvailable ? 'available' : 'unavailable'
                        }`}
                      >
                        {item.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <p>{item.description || getCategoryLabel(item.category)}</p>
                  </div>

                  <div className="dish-card-footer">
                    <span className="dish-price">${Number(item.price).toFixed(2)}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
