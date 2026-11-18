import React, { useState, useEffect } from 'react';
import { fetchMenuItems, MenuItemResponse } from './gerente-menu-api';
import './gerente-menu.css';

interface GerenteMenuAppProps {
  onNavigate: (path: string, params?: any) => void;
}

export function GerenteMenuApp({ onNavigate }: GerenteMenuAppProps) {
  const branchId = 'a1111111-1111-4111-8111-111111111111';

  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMenuItems(branchId);
      const list = Array.isArray(data) ? data : (data.data || []);
      setItems(list);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Administrar platillos</strong></div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H1 + H2 · MANAGER</span>
          <span className="route-tag">/management/menu</span>
        </div>
        
        <h1>Administrar platillos</h1>
        <p className="subtitle-desc">Administración de productos, precios y disponibilidad en tiempo real.</p>

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">CATÁLOGO</span>
            <h2>Menú de Centro</h2>
          </div>

          <div className="filters-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="filter-group" style={{ flex: 1 }}>
              <label>Buscar por nombre</label>
              <input 
                type="text" 
                placeholder="Buscar platillo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155' }}
              />
            </div>
            <div className="filter-group" style={{ width: '200px' }}>
              <label>Categoría</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155' }}
              >
                <option value="Todas">Todas</option>
                <option value="MAIN_COURSE">Plato fuerte</option>
                <option value="STARTER">Entrada</option>
                <option value="DRINK">Bebida</option>
                <option value="DESSERT">Postre</option>
              </select>
            </div>
          </div>

          <div className="table-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <span className="pill-count">{filteredItems.length} platillos encontrados</span>
            <button 
              className="btn-primary-green" 
              onClick={() => onNavigate('/management/menu/new')}
              style={{ background: '#059669', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Nuevo platillo
            </button>
          </div>

          {error && <div style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando platillos...</p>
          ) : (
            <div className="table-responsive">
              <table className="gerente-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center empty-state" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No hay platillos registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '1rem 0' }}>
                          <div className="item-main-name" style={{ fontWeight: 'bold' }}>{item.name}</div>
                          <div className="item-sub-cat" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.category}</div>
                        </td>
                        <td className="text-right font-semibold" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`} style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '999px', 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            background: item.isAvailable ? '#064e3b' : '#7f1d1d',
                            color: item.isAvailable ? '#34d399' : '#fca5a5'
                          }}>
                            {item.isAvailable ? 'Disponible' : 'No disponible'}
                          </span>
                        </td>
                        <td className="text-right action-links" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {/* Botón Activar / Desactivar único */}
                            <button 
                              onClick={() => onNavigate(`/management/menu/${item.id}/availability`, { 
                                itemId: item.id, 
                                dishName: item.name, 
                                currentAvailability: item.isAvailable 
                              })}
                              style={{ 
                                background: item.isAvailable ? '#7f1d1d' : '#064e3b', 
                                border: 'none', 
                                color: '#fff', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {item.isAvailable ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}