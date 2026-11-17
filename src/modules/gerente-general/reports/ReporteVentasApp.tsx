import React, { useState } from 'react';
import './gerencia-reports.css';

interface SalesRow {
  branch: string;
  sales: number;
  orders: number;
}

export function ReporteVentasApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [startDate, setStartDate] = useState('01/10/2026');
  const [endDate, setEndDate] = useState('31/10/2026');

  // Estructura fija de las sucursales de la cadena, con métricas en cero hasta recibir la data del backend
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
          <span className="badge-h">H31 · GENERAL_MANAGER</span>
          <span className="route-tag">/reports/sales</span>
        </div>

        <h1>Reporte de ventas por sucursal</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">REPORTES</span>
            <h2>Ventas de la cadena</h2>
            <p>Totales aprobados (IVA incluido) y cantidad de pedidos PAID.</p>
          </div>

          {/* Filtros de calendario / rango de fechas */}
          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Fecha inicial</label>
              <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group-report">
              <label>Fecha final</label>
              <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} />
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

          {/* Tabla con las sucursales listas y valores en cero */}
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