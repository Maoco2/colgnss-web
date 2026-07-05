import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { BaseChartDirective } from 'ng2-charts';
import { RouterLink } from '@angular/router';
import { DashboardService } from '@core/services/dashboard.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { CalculationsService } from '@core/services/calculations.service';
import { DashboardCard, KPI, UserStats, ProcessingStats, ServerMetrics, ActivityItem, ChartDataItem, CalculationStats } from '@core/models';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatMenuModule,
    MatSelectModule, MatProgressBarModule, MatDividerModule, MatGridListModule,
    BaseChartDirective, RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);
  private calculationsService = inject(CalculationsService);

  loading = signal(true);
  selectedPeriod = signal('today');
  cards = signal<DashboardCard[]>([]);
  userStats = signal<UserStats | null>(null);
  processingStats = signal<ProcessingStats | null>(null);
  serverMetrics = signal<ServerMetrics | null>(null);
  kpis = signal<KPI[]>([]);
  calculationStats = signal<CalculationStats | null>(null);
  recentActivity = signal<ActivityItem[]>([]);
  error = signal<string | null>(null);

  periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' },
    { value: 'year', label: 'Este Año' },
  ];

  kpiCards = computed<{
    icon: string; color: string; label: string; value: string; trend?: number; trendLabel?: string;
  }[]>(() => {
    const k = this.kpis();
    const defaultCards = [
      { icon: 'people', color: '#3b82f6', label: 'Total Usuarios', value: '—' },
      { icon: 'trending_up', color: '#22c55e', label: 'Usuarios Activos Hoy', value: '—' },
      { icon: 'assessment', color: '#f97316', label: 'Procesamientos Hoy', value: '—' },
      { icon: 'folder', color: '#a855f7', label: 'Archivos RINEX', value: '—' },
      { icon: 'timer', color: '#14b8a6', label: 'Tiempo Promedio', value: '—' },
      { icon: 'attach_money', color: '#eab308', label: 'Ingresos', value: '—' },
      { icon: 'memory', color: '#ef4444', label: 'CPU', value: '—' },
      { icon: 'storage', color: '#3b82f6', label: 'RAM', value: '—' },
    ];
    return defaultCards.map((c, i) => {
      const match = k[i];
      return {
        ...c,
        value: match ? this.formatValue(match.value, match.unit) : c.value,
        trend: match?.change,
        trendLabel: match?.period,
      };
    });
  });

  userChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  processingChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  moduleChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 } } },
    },
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } },
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getDashboardCards().subscribe({
      next: (data) => this.cards.set(data),
      error: () => {},
    });
    this.dashboardService.getUserStats(this.selectedPeriod()).subscribe({
      next: (data) => this.userStats.set(data),
      error: () => {},
    });
    this.dashboardService.getProcessingStats().subscribe({
      next: (data) => this.processingStats.set(data),
      error: () => {},
    });
    this.dashboardService.getServerMetrics().subscribe({
      next: (data) => this.serverMetrics.set(data),
      error: () => {},
    });
    this.dashboardService.getKpis().subscribe({
      next: (data) => this.kpis.set(data),
      error: () => {},
    });
    this.analyticsService.getUsersRegistered().subscribe({
      next: (data) => this.buildUserChart(data),
      error: () => {},
    });
    this.analyticsService.getProcessings({ period: this.selectedPeriod() }).subscribe({
      next: (data) => this.buildProcessingChart(data),
      error: () => {},
    });
    this.analyticsService.getProcessingsByModule().subscribe({
      next: (data) => this.buildModuleChart(data),
      error: () => {},
    });
    this.calculationsService.getCalculationStats().subscribe({
      next: (data) => this.calculationStats.set(data),
      error: () => {},
    });
    this.loadRecentActivity();
    setTimeout(() => this.loading.set(false), 800);
  }

  private loadRecentActivity(): void {
    this.dashboardService.getRecentActivity(10).subscribe({
      next: (data) => this.recentActivity.set(data),
      error: () => {},
    });
  }

  private buildUserChart(data: any[]): void {
    const labels = data.map((d) => d.label || d.date);
    const values = data.map((d) => d.value || d.count || 0);
    this.userChartData.set({
      labels,
      datasets: [{
        label: 'Usuarios',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      }],
    });
  }

  private buildProcessingChart(data: any[]): void {
    const labels = data.map((d) => d.label || d.date);
    const values = data.map((d) => d.value || d.count || 0);
    this.processingChartData.set({
      labels,
      datasets: [{
        label: 'Procesamientos',
        data: values,
        backgroundColor: 'rgba(249,115,22,0.7)',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 4,
      }],
    });
  }

  private buildModuleChart(data: any[]): void {
    const labels = data.map((d) => d.module || d.label);
    const values = data.map((d) => d.count || d.value || 0);
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308'];
    this.moduleChartData.set({
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
      }],
    });
  }

  refreshData(): void {
    this.loadData();
  }

  filterByPeriod(period: string): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  private formatValue(value: number, unit?: string): string {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M' + (unit ? ` ${unit}` : '');
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K' + (unit ? ` ${unit}` : '');
    return value.toLocaleString() + (unit ? ` ${unit}` : '');
  }
}
