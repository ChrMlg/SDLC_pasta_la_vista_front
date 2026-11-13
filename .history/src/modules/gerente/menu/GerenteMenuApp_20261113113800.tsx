import React, { useState, useEffect } from 'react';
import { fetchMenuItems, MenuItemResponse } from './gerente-menu-api';
import './gerente-menu.css';

// ID de ejemplo de la sucursal Centro (puedes adaptarlo al UUID real de tu base de datos semilla)
const CENTRO_BRANCH_ID = 'uuid-sucursal-centro-aqui'; 

export function GerenteMenuApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar platillos desde el backend al montar o filtrar
  useEffect(() => {
    loadMenu();
  }, [selectedCategory]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchMenuItems(CENTRO_BRANCH_ID, searchTerm, selectedCategory);
      setItems(response.data);
    } catch (err) {
      setError('No se pudieron cargar los platillos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMenu();
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      STARTER: 'Entrada',
      MAIN_COURSE: 'Plato fuerte',
      DRINK: 'Bebida',
      DESSERT: 'Postre',
    };
    return map[cat] || cat;
  };

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Administrar platillos</strong></div>
        <div className="gerente-branch-badge">Centro - Conectado al Back</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H1 + H2 · MANAGER</span>
          <span className="route-tag">/management/menu</span>
        </div>
        
        <h1>Administrar platillos</h1>
        <p className="subtitle-desc">Gestión oficial de productos, precios y disponibilidad en base de datos.</p>

        {error && <div className="alert-error">{error}</div>}

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">CATÁLOGO</span>
            <h2>Menú de Centro</h2>
            <p>Administración de productos, precios y disponibilidad.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="filters-row">
            <div className="filter-group">
              <label>Buscar por nombre</label>
              <input 
                type="text" 
                placeholder="Buscar platillo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Categoría</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="Todas">Todas</option>
                <option value="STARTER">Entrada</option>
                <option value="MAIN_COURSE">Plato fuerte</option>
                <option value="DRINK">Bebida</option>
                <option value="DESSERT">Postre</option>
              </select>
            </div>
          </form>

          <div className="table-actions-bar">
            <span className="pill-count">{items.length} platillos encontrados</span>
            <button 
              className="btn-primary-green" 
              onClick={() => onNavigate('/management/menu/new')}
            >
              + Nuevo platillo
            </button>
          </div>

          <div className="table-responsive">
            <table className="gerente-table">
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center empty-state">Cargando platillos...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="text-center empty-state">No hay platillos registrados.</td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-main-name">{item.name}</div>
                        <div className="item-sub-cat">{getCategoryLabel(item.category)}</div>
                      </td>
                      <td className="text-right font-semibold">${item.price}</td>
                      <td>
                        <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                          {item.isAvailable ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="text-right action-links">
                        <button 
                          className="link-btn"
                          onClick={() => onNavigate(`/management/menu/${item.id}/editar`)}
                        >
                          Editar · Desactivar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}