import React, { useState } from 'react';
import './gerencia-reports.css';

export function HorariosDemandaApp() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Horarios de mayor demanda</strong>
        </div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/peak-hours</span>
        </div>

        <h1>Horarios de mayor demanda</h1>

        <div className="card-report-panel">
          <div className="catalog-header-text">
            <span className="catalog-tag">DEMANDA</span>
            <h2>Horarios pico</h2>
            <p>Pedidos PAID agrupados en intervalos de 60 minutos.</p>
          </div>

          {/* Filtros de calendario */}
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

          {/* Gráfico preparado para conectarse al backend */}
          <div className="chart-container-box">
            <div className="mock-line-chart" style={{ height: '160px' }}>
              <span>[ Gráfico de barras de demanda por intervalos horarios - Se poblará al conectar el backend ]</span>
            </div>
          </div>

          {/* Listado Top franjas en cero / vacío preparado */}
          <div className="metric-card-box" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a' }}>Top 3 franjas · Centro</h4>
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', padding: '1rem 0' }}>
              Los horarios pico aparecerán aquí al sincronizar con la base de datos.
            </div>
          </div>

          <div className="footer-report-note">
            Empates: primero fecha y hora más antigua. Comparaciones con misma zona horaria.
          </div>
        </div>
      </main>
    </div>
  );
}