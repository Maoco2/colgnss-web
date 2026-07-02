import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { AdvertisingService } from '@core/services/advertising.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Advertisement } from '@core/models';

@Component({
  selector: 'app-advertising',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatDividerModule, MatDialogModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, BaseChartDirective,
  ],
  templateUrl: './advertising.component.html',
  styleUrls: ['./advertising.component.scss'],
})
export class AdvertisingComponent implements OnInit {
  private advertisingService = inject(AdvertisingService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  ads = signal<Advertisement[]>([]);
  stats = signal<any>(null);

  displayedColumns = ['name', 'type', 'platform', 'status', 'impressions', 'clicks', 'ctr', 'revenue', 'actions'];
  revenueChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  chartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.advertisingService.getAds().subscribe({
      next: (res) => this.ads.set(res.data || []),
      error: () => {},
    });
    this.advertisingService.getAdStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.buildRevenueChart(data);
      },
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 600);
  }

  private buildRevenueChart(stats: any): void {
    const days = stats.clicksByDay ? Object.keys(stats.clicksByDay) : [];
    this.revenueChartData.set({
      labels: days.slice(-30),
      datasets: [
        { label: 'Clicks', data: days.slice(-30).map((d) => stats.clicksByDay[d] || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
        { label: 'Impressiones', data: days.slice(-30).map((d) => stats.impressionsByDay[d] || 0), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 3 },
      ],
    });
  }

  openAdDialog(ad?: Advertisement): void {
    const dialogRef = this.dialog.open(AdDialog, { width: '600px', data: { ad } });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  deleteAd(ad: Advertisement): void {
    if (!confirm(`¿Eliminar el anuncio "${ad.title}"?`)) return;
    this.advertisingService.deleteAd(ad.id).subscribe({ next: () => this.loadData(), error: () => {} });
  }

  calcCtr(ad: Advertisement): string {
    if (!ad.impressionCount) return '0%';
    return ((ad.clickCount / ad.impressionCount) * 100).toFixed(2) + '%';
  }
}

@Component({
  selector: 'app-ad-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>{{ data.ad ? 'Editar' : 'Nuevo' }} Anuncio</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput #title [value]="data.ad?.title || ''">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput #desc [value]="data.ad?.description || ''" rows="3"></textarea>
        </mat-form-field>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select #type [value]="data.ad?.type || 'banner'">
              <mat-option value="banner">Banner</mat-option>
              <mat-option value="sidebar">Sidebar</mat-option>
              <mat-option value="popup">Pop-up</mat-option>
              <mat-option value="inline">Inline</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select #status [value]="data.ad?.status || 'active'">
              <mat-option value="active">Activo</mat-option>
              <mat-option value="inactive">Inactivo</mat-option>
              <mat-option value="expired">Expirado</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>URL Imagen</mat-label>
            <input matInput #img [value]="data.ad?.imageUrl || ''">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>URL Destino</mat-label>
            <input matInput #link [value]="data.ad?.linkUrl || ''">
          </mat-form-field>
        </div>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="startPicker" #start [value]="data.ad?.startDate ? (data.ad!.startDate | date:'yyyy-MM-dd') : ''">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fin</mat-label>
            <input matInput [matDatepicker]="endPicker" #end [value]="data.ad?.endDate ? (data.ad!.endDate | date:'yyyy-MM-dd') : ''">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Max. Clicks</mat-label>
            <input matInput type="number" #maxClicks [value]="data.ad?.maxClicks || ''">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max. Impresiones</mat-label>
            <input matInput type="number" #maxImpressions [value]="data.ad?.maxImpressions || ''">
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="{
        title: title.value, description: desc.value, type: type.value, status: status.value,
        imageUrl: img.value, linkUrl: link.value, startDate: start.value, endDate: end.value,
        maxClicks: maxClicks.value ? +maxClicks.value : undefined, maxImpressions: maxImpressions.value ? +maxImpressions.value : undefined
      }">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 500px; padding-top: 8px; }
    .dialog-row { display: flex; gap: 16px; }
    .dialog-row mat-form-field { flex: 1; }
  `],
})
export class AdDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { ad?: Advertisement }) {}
}
