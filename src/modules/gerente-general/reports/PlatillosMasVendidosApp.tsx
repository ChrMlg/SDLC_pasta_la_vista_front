import React, { useState } from 'react';
import './gerencia-reports.css';

interface TopDishItem {
  rank: string;
  name: string;
  category: string;
  units: number;
}

export function PlatillosMasVendidosApp() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [topLimit, setTopLimit] = useState('Top 5');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);

  // Lista vacía a la espera de los datos del backend
  const [dishes] = useState<TopDishItem[]>([]);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Platillos más vendidos</strong>
        </div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/top-dishes</span>
        </div>

        <h1>Platillos más vendidos</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">POPULARIDAD</span>
            <h2>Top platillos</h2>
            <p>Unidades vendidas en pedidos pagados y no anulados.</p>
          </div>

          {/* Filtros: Sucursal, Límite Top, Fechas */}
          <div className="date-filters-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group-report">
              <label>Sucursal</label>
              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Centro">Centro</option>
                <option value="Bambu">Bambu</option>
                <option value="Ramblas">Ramblas</option>
              </select>
            </div>
            <div className="form-group-report">
              <label>Límite</label>
              <select value={topLimit} onChange={e => setTopLimit(e.target.value)} style={{ padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Top 5">Top 5</option>
                <option value="Top 10">Top 10</option>
                <option value="Top 20">Top 20</option>
              </select>
            </div>
          </div>

          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Desde</label>
              <input type="date" max={today} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group-report">
              <label>Hasta</label>
              <input type="date" max={today} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Listado o estado vacío */}
          {dishes.length === 0 ? (
            <div className="empty-state-box">
              No hay datos disponibles. Orden descendente de unidades. Si el período no tiene ventas elegibles: «No hay datos disponibles».
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {dishes.map((item, idx) => (
                <div key={idx} className="metric-card-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{item.rank} · {item.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.category}</div>
                  </div>
                  <strong>{item.units} unidades</strong>
                </div>
              ))}
            </div>
          )}

          <div className="footer-report-note">
            Orden descendente de unidades. Si el período no tiene ventas elegibles: «No hay datos disponibles».
          </div>
        </div>
      </main>
    </div>
  );
}