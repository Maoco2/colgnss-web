import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseChartDirective } from 'ng2-charts';
import { CatalogsService } from '@core/services/catalogs.service';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-catalogs',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTabsModule,
    MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatDividerModule, MatProgressBarModule, BaseChartDirective,
  ],
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss'],
})
export class CatalogsComponent implements OnInit {
  private catalogsService = inject(CatalogsService);

  loading = signal(true);
  selectedTabIndex = signal(0);

  receivers = signal<any[]>([]);
  antennas = signal<any[]>([]);
  firmwares = signal<any[]>([]);
  rinexVersions = signal<any[]>([]);
  crxVersions = signal<any[]>([]);
  manufacturers = signal<any[]>([]);

  receiverColumns: string[] = ['name', 'manufacturer', 'model', 'type', 'userCount', 'processingCount', 'successRate'];
  antennaColumns: string[] = ['name', 'manufacturer', 'model', 'type', 'gain', 'userCount'];
  manufacturerColumns: string[] = ['rank', 'manufacturer', 'receiverCount', 'antennaCount', 'userCount', 'marketShare'];

  receiverSource = new MatTableDataSource<any>([]);
  antennaSource = new MatTableDataSource<any>([]);
  manufacturerSource = new MatTableDataSource<any>([]);

  manufacturerChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  receiverChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

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
    this.loadAll();
  }

  private loadAll(): void {
    this.catalogsService.getReceivers({ limit: 50 }).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.receivers.set(data);
        this.receiverSource.data = data;
      },
      error: () => {},
    });

    this.catalogsService.getAntennas({ limit: 50 }).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.antennas.set(data);
        this.antennaSource.data = data;
      },
      error: () => {},
    });

    this.catalogsService.getManufacturerRanking().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        this.manufacturers.set(list);
        this.manufacturerSource.data = list;
        this.buildCharts(list);
      },
      error: () => {},
    });

    this.catalogsService.getFirmwares().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        this.firmwares.set(data);
      },
      error: () => {},
    });

    this.catalogsService.getRinexVersions().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        this.rinexVersions.set(data);
      },
      error: () => {},
    });

    this.catalogsService.getCrxVersions().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        this.crxVersions.set(data);
      },
      error: () => {},
    });

    setTimeout(() => this.loading.set(false), 600);
  }

  private buildCharts(manufacturers: any[]): void {
    const labels = manufacturers.map((m: any) => m.manufacturer);
    const receiverData = manufacturers.map((m: any) => m.receiverCount || 0);
    const shares = manufacturers.map((m: any) => m.marketShare || 0);
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1'];

    this.manufacturerChartData.set({
      labels,
      datasets: [{ label: 'Participación de Mercado (%)', data: shares, backgroundColor: colors.slice(0, labels.length) + '99', borderColor: colors.slice(0, labels.length), borderWidth: 1, borderRadius: 4 }],
    });

    this.receiverChartData.set({
      labels,
      datasets: [{ label: 'Receptores por Fabricante', data: receiverData, backgroundColor: colors.slice(0, labels.length) + '99', borderColor: colors.slice(0, labels.length), borderWidth: 1, borderRadius: 4 }],
    });
  }

  applyReceiverFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.receiverSource.filter = value.trim().toLowerCase();
  }

  applyAntennaFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.antennaSource.filter = value.trim().toLowerCase();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }
}
