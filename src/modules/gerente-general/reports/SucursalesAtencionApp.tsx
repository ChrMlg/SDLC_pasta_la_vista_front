import React, { useState } from 'react';
import './gerencia-reports.css';

interface BranchPerformanceRow {
  branch: string;
  sales: number;
  difference: string;
  status: string;
}

export function SucursalesAtencionApp() {
  // Sucursales con ventas y diferencias en cero/preparadas para el backend
  const [performanceData] = useState<BranchPerformanceRow[]>([
    { branch: 'Centro', sales: 0, difference: '0.0%', status: 'Normal' },
    { branch: 'Bambu', sales: 0, difference: '0.0%', status: 'Normal' },
    { branch: 'Ramblas', sales: 0, difference: '0.0%', status: 'Normal' }
  ]);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Sucursales que requieren atención</strong>
        </div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/performance</span>
        </div>

        <h1>Sucursales que requieren atención</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">ALERTAS DE NEGOCIO</span>
            <h2>Desempeño de sucursales</h2>
            <p>Comparación con el promedio de las sedes con datos.</p>
          </div>

          {/* Tarjeta de promedio general */}
          <div className="metric-card-box" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="metric-desc">Promedio de ventas · muestra</span>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.2rem' }}>Umbral de atención</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="metric-value-lg" style={{ fontSize: '1.5rem' }}>$0</div>
              <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Más de 20 % bajo promedio</div>
            </div>
          </div>

          {/* Tabla de sucursales */}
          <table className="report-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Diferencia</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.branch}</strong></td>
                  <td>${row.sales.toLocaleString()}</td>
                  <td>{row.difference}</td>
                  <td>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dedup-notice-box" style={{ marginTop: '1.5rem' }}>
            Las alertas de atención se activan si las ventas están más de un 20% por debajo del promedio. Una sucursal sin datos no se marca automáticamente.
          </div>
        </div>
      </main>
    </div>
  );
}