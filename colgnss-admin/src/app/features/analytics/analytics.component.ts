import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService } from '@core/services/analytics.service';
import { ChartConfiguration, ChartData } from 'chart.js';

interface ChartConfig {
  id: string;
  title: string;
  description: string;
  type: 'line' | 'bar' | 'doughnut' | 'polarArea' | 'radar';
  data: ChartData;
  options: ChartConfiguration['options'];
  loading: boolean;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule,
    MatInputModule, MatMenuModule, MatDividerModule, FormsModule,
    BaseChartDirective,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  startDate = signal<string>('');
  endDate = signal<string>('');
  loading = signal(true);
  charts = signal<ChartConfig[]>([]);

  private baseLineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
    elements: { line: { tension: 0.4 } },
  };

  private baseBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  private doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } },
  };

  private polarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } },
    scales: { r: { ticks: { display: false } } },
  };

  private radarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } },
    scales: { r: { ticks: { display: false, backdropColor: 'transparent' } } },
  };

  ngOnInit(): void {
    this.initCharts();
    this.loadAllData();
  }

  private initCharts(): void {
    this.charts.set([
      { id: 'usersByMonth', title: 'Usuarios Registrados por Mes', description: 'Evolución mensual de registros de usuarios', type: 'line', data: { labels: [], datasets: [] }, options: this.baseLineOptions, loading: true },
      { id: 'activeDaily', title: 'Usuarios Activos Diarios', description: 'Usuarios activos por día en el período', type: 'bar', data: { labels: [], datasets: [] }, options: this.baseBarOptions, loading: true },
      { id: 'activeByHour', title: 'Usuarios Activos por Hora', description: 'Distribución de actividad en 24 horas', type: 'bar', data: { labels: [], datasets: [] }, options: this.baseBarOptions, loading: true },
      { id: 'calculationsDaily', title: 'C&aacute;lculos Diarios', description: 'Cantidad de c&aacute;lculos por d&iacute;a', type: 'line', data: { labels: [], datasets: [] }, options: this.baseLineOptions, loading: true },
      { id: 'calculationsMonthly', title: 'C&aacute;lculos Mensuales', description: 'C&aacute;lculos agregados por mes', type: 'bar', data: { labels: [], datasets: [] }, options: this.baseBarOptions, loading: true },
      { id: 'calculationsByNetwork', title: 'C&aacute;lculos por Red', description: 'Distribuci&oacute;n por tipo de red', type: 'doughnut', data: { labels: [], datasets: [] }, options: this.doughnutOptions, loading: true },
      { id: 'avgTimeArea', title: 'Tiempo Promedio de Rastreo', description: 'Evoluci&oacute;n del tiempo promedio de c&aacute;lculo', type: 'line', data: { labels: [], datasets: [] }, options: { ...this.baseLineOptions, elements: { line: { tension: 0.4, fill: true } } }, loading: true },
      { id: 'topUsers', title: 'Top 10 Usuarios', description: 'Usuarios con m&aacute;s c&aacute;lculos', type: 'bar', data: { labels: [], datasets: [] }, options: { ...this.baseBarOptions, indexAxis: 'y' }, loading: true },
      { id: 'topStations', title: 'Top 10 Estaciones', description: 'Estaciones con más actividad', type: 'bar', data: { labels: [], datasets: [] }, options: { ...this.baseBarOptions, indexAxis: 'y' }, loading: true },
    ]);
  }

  private loadAllData(): void {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (this.startDate()) params['startDate'] = this.startDate();
    if (this.endDate()) params['endDate'] = this.endDate();

    this.analyticsService.getUsersRegistered().subscribe(data => this.updateChart('usersByMonth', this.buildLineData(data, 'Usuarios', '#3b82f6', 'rgba(59,130,246,0.15)')));
    this.analyticsService.getUsersActive().subscribe(data => {
      this.updateChart('activeDaily', this.buildBarData(data, 'Activos', '#22c55e'));
    });
    this.analyticsService.getUsersActiveHourly().subscribe(data => {
      this.updateChart('activeByHour', this.buildBarData(data, 'Por hora', '#a855f7'));
    });
    this.analyticsService.getCalculations({ ...params }).subscribe(data => this.updateChart('calculationsDaily', this.buildLineData(data, 'C&aacute;lculos', '#f97316', 'rgba(249,115,22,0.1)')));
    this.analyticsService.getCalculations({ ...params }).subscribe(data => this.updateChart('calculationsMonthly', this.buildBarData(data, 'Mensuales', '#3b82f6')));
    this.analyticsService.getCalculationsByNetwork().subscribe(data => this.updateChart('calculationsByNetwork', this.buildDoughnutData(data, 'Red')));
    this.analyticsService.getAvgCalculationTime().subscribe(data => this.updateChart('avgTimeArea', this.buildLineData(data, 'Tiempo (min)', '#14b8a6', 'rgba(20,184,166,0.2)')));
    this.analyticsService.getTopUsers().subscribe(data => this.updateChart('topUsers', this.buildBarData(data, 'Top 10', '#eab308')));
    this.analyticsService.getTopStations().subscribe(data => this.updateChart('topStations', this.buildBarData(data.slice(0, 10), 'Top 10', '#6366f1')));

    setTimeout(() => {
      this.charts.update(charts => charts.map(c => ({ ...c, loading: false })));
      this.loading.set(false);
    }, 1000);
  }

  private updateChart(id: string, data: ChartData): void {
    this.charts.update(charts => charts.map(c => c.id === id ? { ...c, data, loading: false } : c));
  }

  private buildLineData(data: any[], label: string, borderColor: string, bgColor: string): ChartData<'line'> {
    const labels = data.map(d => d.label || d.date || '');
    const values = data.map(d => d.value || d.count || 0);
    return {
      labels,
      datasets: [{ label, data: values, borderColor, backgroundColor: bgColor, fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: borderColor }],
    };
  }

  private buildBarData(data: any[], label: string, color: string): ChartData<'bar'> {
    const labels = data.map(d => d.label || d.name || d.date || '');
    const values = data.map(d => d.value || d.count || 0);
    return {
      labels,
      datasets: [{ label, data: values, backgroundColor: color + '99', borderColor: color, borderWidth: 1, borderRadius: 3 }],
    };
  }

  private buildDoughnutData(data: any[], key: string): ChartData<'doughnut'> {
    const labels = data.map(d => d[key] || d.module || d.label || '');
    const values = data.map(d => d.count || d.value || 0);
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#ec4899', '#8b5cf6'];
    return {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }],
    };
  }

  private buildRadarData(data: any[]): ChartData<'radar'> {
    const labels = data.map(d => d.constellation || d.label || '');
    const values = data.map(d => d.count || d.value || 0);
    return {
      labels,
      datasets: [{
        label: 'Uso',
        data: values,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.2)',
        pointBackgroundColor: '#a855f7',
        pointRadius: 3,
      }],
    };
  }



  applyDateFilter(): void {
    this.loading.set(true);
    this.charts.update(charts => charts.map(c => ({ ...c, loading: true })));
    this.loadAllData();
  }

  clearFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
    this.applyDateFilter();
  }

  exportData(): void {
    const csvContent = this.charts().map(c => {
      const labels = c.data.labels?.join(',') || '';
      const values = c.data.datasets?.[0]?.data?.join(',') || '';
      return `${c.title}\n${labels}\n${values}`;
    }).join('\n\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
