import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { BaseChartDirective } from 'ng2-charts';
import { ApiKeysService } from '@core/services/api-keys.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiKey } from '@core/models';

@Component({
  selector: 'app-api-public',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatDividerModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatTooltipModule,
    MatTabsModule, BaseChartDirective,
  ],
  templateUrl: './api-public.component.html',
  styleUrls: ['./api-public.component.scss'],
})
export class ApiPublicComponent implements OnInit {
  private apiKeysService = inject(ApiKeysService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  apiKeys = signal<ApiKey[]>([]);
  usageLogs = signal<any[]>([]);
  selectedKey = signal<string | null>(null);

  keyColumns = ['name', 'key', 'clientId', 'status', 'rateLimit', 'lastUsed', 'expires', 'actions'];
  logColumns = ['endpoint', 'method', 'status', 'ip', 'responseTime', 'timestamp'];

  requestsChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  topEndpointsData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

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
    this.apiKeysService.getApiKeys().subscribe({
      next: (res) => this.apiKeys.set(res || []),
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 400);
  }

  loadUsageLogs(keyId: string): void {
    this.selectedKey.set(keyId);
    this.apiKeysService.getUsageLogs(keyId).subscribe({
      next: (res) => {
        this.usageLogs.set(res || []);
        this.buildUsageCharts(res || []);
      },
      error: () => {},
    });
  }

  private buildUsageCharts(logs: any[]): void {
    const byDate: Record<string, number> = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp).toLocaleDateString();
      byDate[d] = (byDate[d] || 0) + 1;
    });
    const dates = Object.keys(byDate).sort();
    this.requestsChartData.set({
      labels: dates,
      datasets: [{ label: 'Peticiones', data: dates.map((d) => byDate[d]), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 3 }],
    });

    const byEndpoint: Record<string, number> = {};
    logs.forEach((l) => { byEndpoint[l.endpoint] = (byEndpoint[l.endpoint] || 0) + 1; });
    const top = Object.entries(byEndpoint).sort((a, b) => b[1] - a[1]).slice(0, 10);
    this.topEndpointsData.set({
      labels: top.map(([e]) => e),
      datasets: [{ label: 'Peticiones', data: top.map(([, c]) => c), backgroundColor: 'rgba(59,130,246,0.6)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4 }],
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateApiKeyDialog, { width: '500px' });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiKeysService.createApiKey(result).subscribe({ next: () => this.loadData(), error: () => {} });
      }
    });
  }

  revokeKey(key: ApiKey): void {
    if (!confirm(`¿Revocar la API Key "${key.name}"? Esta acción no se puede deshacer.`)) return;
    this.apiKeysService.revokeApiKey(key.id).subscribe({ next: () => this.loadData(), error: () => {} });
  }

  maskKey(key: string): string {
    if (!key) return '—';
    return key.slice(0, 8) + '••••' + key.slice(-4);
  }

  getMethodColor(method: string): string {
    const map: Record<string, string> = { GET: 'primary', POST: 'accent', PUT: '', PATCH: '', DELETE: 'warn' };
    return map[method] || '';
  }
}

@Component({
  selector: 'app-create-api-key',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>Nueva API Key</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput #name>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Rate Limit (req/min)</mat-label>
          <input matInput type="number" #rateLimit value="60">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>IPs Permitidas (separadas por coma)</mat-label>
          <input matInput #allowedIps placeholder="192.168.1.1, 10.0.0.1">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Expiración (días)</mat-label>
          <input matInput type="number" #expires value="365">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="buildApiKeyData(name.value, rateLimit.value, allowedIps.value, expires.value)">Crear</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 400px; padding-top: 8px; }
  `],
})
export class CreateApiKeyDialog {
  buildApiKeyData(name: string, rateLimit: string, allowedIps: string, expires: string): any {
    return {
      name,
      rateLimit: +rateLimit,
      allowedIps: allowedIps ? allowedIps.split(',').map((s: string) => s.trim()) : [],
      expiresAt: expires ? new Date(Date.now() + +expires * 86400000).toISOString() : undefined,
    };
  }
}
