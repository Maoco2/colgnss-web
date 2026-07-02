import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { GnssStatsService } from '@core/services/gnss-stats.service';
import { ChartConfiguration, ChartData } from 'chart.js';

interface ConstellationOverview {
  name: string;
  icon: string;
  color: string;
  files: number;
  observations: number;
  epochs: number;
  avgSatellites: number;
  maxSatellites: number;
  availability: number;
  usageFrequency: number;
}

@Component({
  selector: 'app-gnss-stats',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatTableModule, MatSortModule, MatDividerModule, MatProgressBarModule,
    MatTooltipModule, BaseChartDirective,
  ],
  templateUrl: './gnss-stats.component.html',
  styleUrls: ['./gnss-stats.component.scss'],
})
export class GnssStatsComponent implements OnInit {
  private gnssStatsService = inject(GnssStatsService);

  loading = signal(true);
  constellations = signal<ConstellationOverview[]>([]);

  displayedColumns: string[] = ['name', 'files', 'observations', 'epochs', 'avgSatellites', 'maxSatellites', 'availability', 'usage'];
  dataSource = new MatTableDataSource<ConstellationOverview>([]);

  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  radarChartData = signal<ChartData<'radar'>>({ labels: [], datasets: [] });

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
    },
  };

  radarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
    scales: { r: { ticks: { display: false, backdropColor: 'transparent' }, grid: { color: 'rgba(0,0,0,0.08)' } } },
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.gnssStatsService.getConstellationStats().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : res?.data?.constellations || res?.constellations || [];
        const constData: ConstellationOverview[] = raw.map((c: any, i: number) => ({
          name: c.constellation || c.name || 'N/A',
          icon: 'satellite_alt',
          color: (['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6'])[i % 7],
          files: c.files || c.totalFiles || 0,
          observations: c.observations || c.totalObservations || 0,
          epochs: c.epochs || c.totalEpochs || 0,
          avgSatellites: c.avgSatellites || c.averageSatellites || 0,
          maxSatellites: c.maxSatellites || c.maxSimultaneous || 0,
          availability: c.availability || c.availabilityPercent || 0,
          usageFrequency: c.usageFrequency || c.frequency || 0,
        }));
        this.constellations.set(constData);
        this.dataSource.data = constData;
        this.buildCharts(constData);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildCharts(data: ConstellationOverview[]): void {
    this.barChartData.set({
      labels: data.map(d => d.name),
      datasets: [{
        label: 'Archivos Procesados',
        data: data.map(d => d.files),
        backgroundColor: data.map(d => d.color + '99'),
        borderColor: data.map(d => d.color),
        borderWidth: 1,
        borderRadius: 4,
      }],
    });

    this.radarChartData.set({
      labels: data.map(d => d.name),
      datasets: [
        {
          label: 'Satélites Promedio',
          data: data.map(d => d.avgSatellites),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          pointBackgroundColor: '#3b82f6',
        },
        {
          label: 'Disponibilidad (%)',
          data: data.map(d => d.availability),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.15)',
          pointBackgroundColor: '#22c55e',
        },
      ],
    });
  }

  formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }
}
