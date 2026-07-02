import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BaseChartDirective } from 'ng2-charts';
import { MonitorService } from '@core/services/monitor.service';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatProgressBarModule, MatTooltipModule, MatDividerModule, BaseChartDirective,
  ],
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
})
export class MonitorComponent implements OnInit {
  private monitorService = inject(MonitorService);

  loading = signal(true);
  currentStatus = signal<any>(null);
  history = signal<any[]>([]);
  displayedColumns = ['timestamp', 'cpu', 'ram', 'disk', 'responseTime', 'activeConnections', 'errors'];

  cpuChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  alertThresholds = signal<any[]>([
    { metric: 'CPU', operator: '>', threshold: 90, severity: 'critical', color: '#ef4444' },
    { metric: 'RAM', operator: '>', threshold: 85, severity: 'warning', color: '#f97316' },
    { metric: 'DISCO', operator: '>', threshold: 90, severity: 'critical', color: '#ef4444' },
    { metric: 'Tiempo Respuesta', operator: '>', threshold: 2000, severity: 'warning', color: '#f97316' },
  ]);

  statusSummary = computed(() => {
    const s = this.currentStatus();
    if (!s) return null;
    return {
      cpu: s.cpuUsage ?? 0,
      ram: s.memoryUsage ?? 0,
      ramTotal: s.memoryTotal ?? 16384,
      disk: s.diskUsage ?? 0,
      diskTotal: s.diskTotal ?? 512,
      storage: Math.round(((s.diskUsage ?? 0) / (s.diskTotal ?? 512)) * 100),
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  barOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.monitorService.getCurrentStatus().subscribe({
      next: (data) => this.currentStatus.set(data),
      error: () => {},
    });
    this.monitorService.getHistory({ hours: 24 }).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        this.history.set(list);
        this.buildCharts(list);
      },
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 600);
  }

  refresh(): void {
    this.loadData();
  }

  private buildCharts(data: any[]): void {
    const labels = data.map((d) => {
      const t = new Date(d.timestamp);
      return t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0');
    });
    this.cpuChartData.set({
      labels,
      datasets: [
        {
          label: 'CPU %',
          data: data.map((d) => d.cpuUsage ?? 0),
          borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 2,
        },
        {
          label: 'RAM %',
          data: data.map((d) => d.memoryUsage ?? 0),
          borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 2,
        },
      ],
    });
    this.barChartData.set({
      labels,
      datasets: [{
        label: 'Tiempo Respuesta (ms)',
        data: data.map((d) => d.responseTime ?? 0),
        backgroundColor: 'rgba(249,115,22,0.6)', borderColor: '#f97316', borderWidth: 1, borderRadius: 3,
      }],
    });
  }

  getCpuColor(val: number): string {
    if (val > 90) return '#ef4444';
    if (val > 70) return '#f97316';
    return '#22c55e';
  }
}
