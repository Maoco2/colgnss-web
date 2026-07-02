import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { BaseChartDirective } from 'ng2-charts';
import { DataWarehouseService } from '@core/services/data-warehouse.service';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-data-warehouse',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatDividerModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatChipsModule, BaseChartDirective,
  ],
  templateUrl: './data-warehouse.component.html',
  styleUrls: ['./data-warehouse.component.scss'],
})
export class DataWarehouseComponent implements OnInit {
  private dataWarehouseService = inject(DataWarehouseService);

  loading = signal(true);
  entries = signal<any[]>([]);
  summary = signal<any>(null);
  selectedPeriod = signal('daily');
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  selectedMetric = signal('all');

  periods = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
  ];

  displayedColumns = ['metric', 'value', 'dimension', 'date'];

  trendChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  chartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
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
    const params: Record<string, string | number | boolean | undefined> = {
      period: this.selectedPeriod(),
    };
    if (this.startDate()) params['from'] = this.startDate()!.toISOString();
    if (this.endDate()) params['to'] = this.endDate()!.toISOString();

    this.dataWarehouseService.getEntries(params).subscribe({
      next: (res) => {
        const list = res || [];
        this.entries.set(list);
        this.buildTrendChart(list);
      },
      error: () => {},
    });
    this.dataWarehouseService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 500);
  }

  private buildTrendChart(data: any[]): void {
    const grouped: Record<string, number> = {};
    data.forEach((d) => {
      const date = d.syncedAt ? new Date(d.syncedAt).toLocaleDateString() : d.createdAt;
      grouped[date] = (grouped[date] || 0) + 1;
    });
    const dates = Object.keys(grouped).sort();
    this.trendChartData.set({
      labels: dates,
      datasets: [{
        label: 'Registros',
        data: dates.map((d) => grouped[d]),
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 3,
      }],
    });
  }

  applyFilters(): void {
    this.loadData();
  }
}
