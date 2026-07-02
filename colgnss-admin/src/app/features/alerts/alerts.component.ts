import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlertsService } from '@core/services/alerts.service';
import { AlertConfig, AlertEvent } from '@core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatDividerModule, MatTabsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatTooltipModule, MatSnackBarModule,
  ],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
})
export class AlertsComponent implements OnInit {
  private alertsService = inject(AlertsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  configs = signal<AlertConfig[]>([]);
  events = signal<AlertEvent[]>([]);

  configColumns = ['name', 'metric', 'operator', 'threshold', 'duration', 'channels', 'status', 'lastTriggered', 'actions'];
  eventColumns = ['configName', 'metric', 'value', 'threshold', 'severity', 'message', 'time', 'acknowledged'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.alertsService.getAlertConfigs().subscribe({
      next: (res) => this.configs.set(res.data || []),
      error: () => {},
    });
    this.alertsService.getAlertEvents().subscribe({
      next: (res) => this.events.set(res.data || []),
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 400);
  }

  openConfigDialog(config?: AlertConfig): void {
    const dialogRef = this.dialog.open(AlertConfigDialog, { width: '550px', data: { config } });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const obs = config
        ? this.alertsService.updateAlertConfig(config.id, result)
        : this.alertsService.createAlertConfig(result);
      obs.subscribe({ next: () => { this.loadData(); this.snackBar.open('Configuración guardada', 'OK', { duration: 3000 }); }, error: () => {} });
    });
  }

  deleteConfig(config: AlertConfig): void {
    if (!confirm(`¿Eliminar la configuración "${config.name}"?`)) return;
    this.alertsService.deleteAlertConfig(config.id).subscribe({ next: () => this.loadData(), error: () => {} });
  }

  acknowledgeEvent(event: AlertEvent): void {
    if (event.status !== 'firing') return;
    this.alertsService.acknowledgeAlert(event.id).subscribe({ next: () => this.loadData(), error: () => {} });
  }

  getSeverityColor(severity: string): string {
    const map: Record<string, string> = { low: '#3b82f6', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    return map[severity] || '#64748b';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { low: 'primary', medium: 'accent', high: 'warn', critical: 'warn' };
    return map[severity] || '';
  }

  getOperatorLabel(op: string): string {
    const map: Record<string, string> = { gt: '>', lt: '<', eq: '=', gte: '>=', lte: '<=', changed: '≠' };
    return map[op] || op;
  }
}

@Component({
  selector: 'app-alert-config-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.config ? 'Editar' : 'Nueva' }} Configuración de Alerta</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput #name [value]="data.config?.name || ''">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Métrica</mat-label>
          <mat-select #metric [value]="data.config?.metric || 'cpu'">
            <mat-option value="cpu">CPU</mat-option>
            <mat-option value="memory">RAM</mat-option>
            <mat-option value="disk">Disco</mat-option>
            <mat-option value="responseTime">Tiempo Respuesta</mat-option>
            <mat-option value="errorRate">Tasa Error</mat-option>
            <mat-option value="activeConnections">Conexiones Activas</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Operador</mat-label>
            <mat-select #operator [value]="data.config?.condition || 'gt'">
              <mat-option value="gt">Mayor que (&gt;)</mat-option>
              <mat-option value="lt">Menor que (&lt;)</mat-option>
              <mat-option value="gte">Mayor o igual (&gt;=)</mat-option>
              <mat-option value="lte">Menor o igual (&lt;=)</mat-option>
              <mat-option value="eq">Igual a (=)</mat-option>
              <mat-option value="changed">Cambió (≠)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Umbral</mat-label>
            <input matInput type="number" #threshold [value]="data.config?.threshold || 90">
          </mat-form-field>
        </div>
        <div class="dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Duración (minutos)</mat-label>
            <input matInput type="number" #duration [value]="data.config?.duration || 5">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Cooldown (min)</mat-label>
            <input matInput type="number" #cooldown [value]="data.config?.cooldown || 15">
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Canales</mat-label>
          <mat-select #channels multiple [value]="data.config?.channels || ['email']">
            <mat-option value="email">Email</mat-option>
            <mat-option value="sms">SMS</mat-option>
            <mat-option value="slack">Slack</mat-option>
            <mat-option value="webhook">Webhook</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle #isActive [checked]="data.config ? data.config.isActive : true">Activo</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="{
        name: name.value, metric: metric.value, condition: operator.value,
        threshold: +threshold.value, duration: +duration.value, cooldown: +cooldown.value,
        channels: channels.value, isActive: isActive.checked
      }">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 450px; padding-top: 8px; }
    .dialog-row { display: flex; gap: 16px; }
    .dialog-row mat-form-field { flex: 1; }
  `],
})
export class AlertConfigDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { config?: AlertConfig }) {}
}
