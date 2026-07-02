import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';
import { StationsService } from '@core/services/stations.service';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-stations',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatSortModule, MatChipsModule, MatDividerModule, MatProgressBarModule,
    MatTooltipModule, MatDialogModule, BaseChartDirective,
  ],
  templateUrl: './stations.component.html',
  styleUrls: ['./stations.component.scss'],
})
export class StationsComponent implements OnInit {
  private stationsService = inject(StationsService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  stations = signal<any[]>([]);
  topStations = signal<any[]>([]);

  displayedColumns: string[] = ['rank', 'code', 'name', 'processingCount', 'avgTime', 'campaigns', 'files', 'observations', 'satellites', 'pppCount'];

  dataSource = new MatTableDataSource<any>([]);

  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
        this.stationsService.getTopStations().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        const enriched = list.map((s: any, i: number) => ({
          rank: i + 1,
          code: s.code || s.station?.code || `ST${String(i + 1).padStart(3, '0')}`,
          name: s.name || s.station?.name || `Estación ${s.code || i + 1}`,
          processingCount: s.processingCount || s.totalProcessings || 0,
          avgTime: s.avgTime || s.averageTime || 0,
          campaigns: s.campaigns || 0,
          files: s.files || s.totalFiles || 0,
          observations: s.observations || s.totalObservations || 0,
          satellites: s.satellitesTracked || s.avgSatellites || 0,
          pppCount: s.pppCount || s.totalPpp || 0,
          status: s.status || s.station?.status || 'active',
          country: s.country || s.station?.country || 'Colombia',
          receiverType: s.receiverType || s.station?.receiverType || '',
          antennaType: s.antennaType || s.station?.antennaType || '',
          location: s.location || s.station?.location || null,
        }));
        this.stations.set(enriched);
        this.dataSource.data = enriched;
        this.topStations.set(enriched.slice(0, 10));
        this.buildChart(enriched.slice(0, 10));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private buildChart(data: any[]): void {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#ec4899', '#8b5cf6'];
    this.barChartData.set({
      labels: data.map(d => d.code),
      datasets: [{
        label: 'Procesamientos',
        data: data.map(d => d.processingCount),
        backgroundColor: data.map((_, i) => colors[i % colors.length] + '99'),
        borderColor: data.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
        borderRadius: 4,
      }],
    });
  }

  openStationDetail(station: any): void {
    this.dialog.open(StationDetailDialog, {
      width: '520px',
      data: { station },
    });
  }

  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { active: 'active', inactive: 'inactive', maintenance: 'maintenance', offline: 'offline' };
    return map[status] || 'inactive';
  }
}

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>Estación {{ data.station.code }}</h2>
    <mat-dialog-content>
      <div class="station-detail">
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">Nombre</span>
            <span class="detail-value">{{ data.station.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Código</span>
            <span class="detail-value">{{ data.station.code }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">País</span>
            <span class="detail-value">{{ data.station.country }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Estado</span>
            <span class="detail-value">
              <mat-chip [color]="data.station.status === 'active' ? 'primary' : 'warn'">
                {{ data.station.status }}
              </mat-chip>
            </span>
          </div>
        </div>
        <mat-divider></mat-divider>
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">Receptor</span>
            <span class="detail-value">{{ data.station.receiverType }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Antena</span>
            <span class="detail-value">{{ data.station.antennaType }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Coordenadas</span>
            <span class="detail-value">{{ data.station.location.lat | number:'1.4f' }}, {{ data.station.location.lng | number:'1.4f' }}</span>
          </div>
        </div>
        <mat-divider></mat-divider>
        <div class="detail-section stats">
          <div class="stat-box">
            <span class="stat-num">{{ data.station.processingCount }}</span>
            <span class="stat-lbl">Procesamientos</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ data.station.satellites }}</span>
            <span class="stat-lbl">Satélites</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ data.station.files }}</span>
            <span class="stat-lbl">Archivos</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ data.station.pppCount }}</span>
            <span class="stat-lbl">PPP</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .station-detail { min-width: 400px; }
    .detail-section { padding: 12px 0; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .detail-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .detail-value { font-size: 14px; color: #1a1a2e; font-weight: 600; text-align: right; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box { text-align: center; }
    .stat-num { display: block; font-size: 20px; font-weight: 700; color: #1a1a2e; }
    .stat-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; }
  `],
})
export class StationDetailDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { station: any }) {}
}
