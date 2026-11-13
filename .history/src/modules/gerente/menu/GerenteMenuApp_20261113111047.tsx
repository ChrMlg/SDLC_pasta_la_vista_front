import React, { useState } from 'react';
import './gerente-menu.css';

interface MenuItem {
  id: string;
  name: string;
  category: 'STARTER' | 'MAIN_COURSE' | 'DRINK' | 'DESSERT';
  categoryLabel: string;
  price: string;
  isAvailable: boolean;
  updatedAt: string;
}

export function GerenteMenuApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Datos de ejemplo basados en el prototipo y reglas de negocio del Módulo 1
  const [items] = useState<MenuItem[]>([
    { id: '1', name: 'Pollo al horno', category: 'MAIN_COURSE', categoryLabel: 'Plato fuerte', price: '13.25', isAvailable: true, updatedAt: '2026-11-04' },
    { id: '2', name: 'Ensalada fresca', category: 'STARTER', categoryLabel: 'Entrada', price: '7.25', isAvailable: true, updatedAt: '2026-11-04' },
    { id: '3', name: 'Flan casero', category: 'DESSERT', categoryLabel: 'Postre', price: '4.50', isAvailable: true, updatedAt: '2026-11-04' },
    { id: '4', name: 'Café de la casa', category: 'DRINK', categoryLabel: 'Bebida', price: '2.75', isAvailable: true, updatedAt: '2026-11-04' },
  ]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.categoryLabel === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="gerente-container">
      <header className="gerente-header">
        <div className="gerente-breadcrumb">Gerente de sucursal / <strong>Administrar platillos</strong></div>
        <div className="gerente-branch-badge">Centro - Vista de ejemplo</div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">
          <span className="badge-h">H1 + H2 · MANAGER</span>
          <span className="route-tag">/management/menu</span>
        </div>
        
        <h1>Administrar platillos</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">CATÁLOGO</span>
            <h2>Menú de Centro</h2>
            <p>Administración de productos, precios y disponibilidad.</p>
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Buscar por nombre</label>
              <input 
                type="text" 
                placeholder="Buscar..." 
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
                <option value="Entrada">Entrada</option>
                <option value="Plato fuerte">Plato fuerte</option>
                <option value="Bebida">Bebida</option>
                <option value="Postre">Postre</option>
              </select>
            </div>
          </div>

          <div className="table-actions-bar">
            <span className="pill-count">10 platillos por página</span>
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
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center empty-state">No hay platillos registrados.</td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="item-main-name">{item.name}</div>
                        <div className="item-sub-cat">{item.categoryLabel}</div>
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

          <footer className="catalog-footer">
            <button className="btn-secondary" disabled>Anterior</button>
            <span className="page-indicator">Página 1 de 1</span>
            <button className="btn-secondary">Siguiente</button>
          </footer>
        </div>
      </main>
    </div>
  );
}