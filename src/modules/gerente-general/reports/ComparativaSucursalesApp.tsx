import React, { useState } from 'react';
import './gerencia-reports.css';

interface BranchOrderCount {
  branch: string;
  orders: number;
}

export function ComparativaSucursalesApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);

  const [branchOrders] = useState<BranchOrderCount[]>([
    { branch: 'Centro', orders: 0 },
    { branch: 'Bambu', orders: 0 },
    { branch: 'Ramblas', orders: 0 }
  ]);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Comparativa entre sucursales</strong>
        </div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/comparison</span>
        </div>

        <h1>Comparativa entre sucursales</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">ANÁLISIS</span>
            <h2>Comparar sucursales</h2>
            <p>Mismo período, métricas y zona horaria para todas las seleccionadas.</p>
          </div>

          {/* Filtros Desde / Hasta con restricción max={today} */}
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

          {/* Etiquetas de sucursales activas */}
          <div className="branch-pills-row">
            <span className="branch-pill">✓ Centro</span>
            <span className="branch-pill">✓ Bambu</span>
            <span className="branch-pill">✓ Ramblas</span>
          </div>

          {/* Gráfico de líneas simulado */}
          <div className="chart-container-box">
            <div className="mock-line-chart">
              <span>[ Gráfico de tendencias de ventas por sucursal en tiempo real ]</span>
            </div>
            <div className="chart-legend">
              <span><span className="legend-dot" style={{ background: '#064e3b' }}></span>Centro</span>
              <span><span className="legend-dot" style={{ background: '#b45309' }}></span>Bambu</span>
              <span><span className="legend-dot" style={{ background: '#64748b' }}></span>Ramblas</span>
            </div>
          </div>

          {/* Grid inferior */}
          <div className="comparison-grid-bottom">
            <div className="metric-card-box">
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Participación de ventas</h4>
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#064e3b', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>3 sedes</div>
                Gráfico de distribución por sucursal
              </div>
            </div>

            <div className="metric-card-box">
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Pedidos pagados</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {branchOrders.map((item, index) => (
                  <li key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: index < branchOrders.length - 1 ? '1px solid #e2e8f0' : 'none', paddingBottom: '0.4rem' }}>
                    <span>{item.branch}</span> <strong>{item.orders}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Botón de retorno */}
          <div className="form-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('/reports/sales')}>
              ← Volver al reporte de ventas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}