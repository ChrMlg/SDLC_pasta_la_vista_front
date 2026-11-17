import React, { useState } from 'react';
import './gerencia-reports.css';

interface SalesRow {
  branch: string;
  sales: number;
  orders: number;
}

export function ReporteVentasApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);

  const [salesData] = useState<SalesRow[]>([
    { branch: 'Centro', sales: 0, orders: 0 },
    { branch: 'Bambu', sales: 0, orders: 0 },
    { branch: 'Ramblas', sales: 0, orders: 0 }
  ]);

  const totalSales = salesData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalOrders = salesData.reduce((acc, curr) => acc + curr.orders, 0);

  const handleRefresh = () => {
    alert('Conectando con el backend para actualizar el reporte de ventas...');
  };

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Reporte de ventas por sucursal</strong>
        </div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/sales</span>
        </div>

        <h1>Reporte de ventas por sucursal</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">REPORTES</span>
            <h2>Ventas de la cadena</h2>
            <p>Totales aprobados (IVA incluido) y cantidad de pedidos PAID.</p>
          </div>

          {/* Filtros de calendario con restricción max={today} para evitar fechas futuras */}
          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Fecha inicial</label>
              <input type="date" max={today} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group-report">
              <label>Fecha final</label>
              <input type="date" max={today} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Tarjetas de totales en cero */}
          <div className="metrics-summary-grid">
            <div className="metric-card-box">
              <span className="metric-desc">Ventas totales · muestra</span>
              <div className="metric-value-lg">${totalSales.toLocaleString()}</div>
            </div>
            <div className="metric-card-box">
              <span className="metric-desc">Pedidos pagados · muestra</span>
              <div className="metric-value-lg">{totalOrders}</div>
            </div>
          </div>

          {/* Tabla con las sucursales listas */}
          <table className="report-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.branch}</strong></td>
                  <td>${row.sales.toLocaleString()}</td>
                  <td>{row.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Botones de acción */}
          <div className="report-actions-row">
            <button type="button" className="btn-secondary" onClick={handleRefresh}>
              Actualizar reporte
            </button>
            <button
              type="button"
              className="btn-primary-green"
              onClick={() => onNavigate('/reports/comparison')}
            >
              Comparar sucursales
            </button>
          </div>

          <div className="footer-report-note">
            No se incluyen pagos rechazados/revertidos ni pedidos anulados. Ceros no equivalen a errores.
          </div>
        </div>
      </main>
    </div>
  );
}