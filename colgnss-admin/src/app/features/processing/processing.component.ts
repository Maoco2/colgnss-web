import { Component, OnInit, signal, inject, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { ProcessingService } from '@core/services/processing.service';
import { ProcessingHistory } from '@core/models';

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatDatepickerModule, MatNativeDateModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule, MatProgressBarModule, FormsModule,
  ],
  templateUrl: './processing.component.html',
  styleUrls: ['./processing.component.scss'],
})
export class ProcessingComponent implements OnInit {
  private processingService = inject(ProcessingService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['inputFile', 'module', 'userName', 'startedAt', 'status', 'duration', 'actions'];
  dataSource = new MatTableDataSource<ProcessingHistory>([]);

  loading = signal(true);
  searchQuery = signal('');
  selectedModule = signal<string>('');
  selectedStatus = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  selectedUser = signal<string>('');
  selectedConstellation = signal<string>('');

  totalCount = signal(0);
  todayCount = signal(0);
  successRate = signal(0);
  avgTime = signal(0);

  modules = ['PPP', 'DGPS', 'RTK', 'PPK', 'RINEX', 'PPPGNSS'];
  statuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
  constellations = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS', 'NavIC', 'SBAS'];

  moduleColors: Record<string, string> = {
    PPP: '#3b82f6',
    DGPS: '#22c55e',
    RTK: '#f97316',
    PPK: '#a855f7',
    RINEX: '#14b8a6',
    PPPGNSS: '#eab308',
  };

  statusColors: Record<string, string> = {
    pending: '#f97316',
    running: '#3b82f6',
    completed: '#22c55e',
    failed: '#ef4444',
    cancelled: '#94a3b8',
  };

  ngOnInit(): void {
    this.loadProcessings();
    this.loadStats();
  }

  loadProcessings(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = { page: 1, limit: 50 };
    if (this.selectedModule()) params['module'] = this.selectedModule();
    if (this.selectedStatus()) params['status'] = this.selectedStatus();
    if (this.startDate()) params['startDate'] = this.startDate();
    if (this.endDate()) params['endDate'] = this.endDate();
    if (this.selectedUser()) params['userId'] = this.selectedUser();
    if (this.selectedConstellation()) params['constellation'] = this.selectedConstellation();

    this.processingService.getProcessings(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.totalCount.set(response.meta?.total || response.data?.length || 0);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.dataSource.filterPredicate = this.customFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar procesamientos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private customFilter(): (data: ProcessingHistory, filter: string) => boolean {
    return (data: ProcessingHistory, filter: string): boolean => {
      const f = filter.toLowerCase();
      return (data.inputFile?.toLowerCase().includes(f) ?? false) ||
        (data.module?.toLowerCase().includes(f) ?? false) ||
        (data.userName?.toLowerCase().includes(f) ?? false);
    };
  }

  loadStats(): void {
    this.processingService.getProcessingStats().subscribe({
      next: (stats) => {
        this.todayCount.set(stats?.todayCount ?? 0);
        this.successRate.set(stats?.successRate ?? 0);
        this.avgTime.set(stats?.avgDuration ?? 0);
      },
      error: () => {},
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  filterByModule(module: string): void {
    this.selectedModule.set(module);
    this.loadProcessings();
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadProcessings();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedModule.set('');
    this.selectedStatus.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.selectedUser.set('');
    this.selectedConstellation.set('');
    this.dataSource.filter = '';
    this.loadProcessings();
  }

  openDetail(processing: ProcessingHistory): void {
    const dialogRef = this.dialog.open(ProcessingDetailDialog, {
      width: '560px',
      data: { processing },
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  exportData(): void {
    const headers = ['Archivo', 'Módulo', 'Usuario', 'Estado', 'Inicio', 'Duración', 'Error'];
    const rows = this.dataSource.filteredData.map(p => [
      p.inputFile, p.module, p.userName, p.status, p.startedAt, p.duration, p.errorMessage,
    ].map(v => `"${v ?? ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procesamientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'hourglass_empty',
      running: 'sync',
      completed: 'check_circle',
      failed: 'error',
      cancelled: 'cancel',
    };
    return icons[status] || 'help';
  }
}

@Component({
  selector: 'app-processing-detail',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>Detalle de Procesamiento</h2>
    <mat-dialog-content>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Archivo</span>
          <span class="detail-value">{{ data.processing.inputFile || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Módulo</span>
          <span class="detail-value">
            <mat-chip>{{ data.processing.module }}</mat-chip>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Usuario</span>
          <span class="detail-value">{{ data.processing.userName || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Estado</span>
          <span class="detail-value">
            <mat-chip [color]="getStatusColor()">{{ data.processing.status }}</mat-chip>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Progreso</span>
          <span class="detail-value">
            <mat-progress-bar mode="determinate" [value]="data.processing.progress"></mat-progress-bar>
            <span class="progress-text">{{ data.processing.progress }}%</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Inicio</span>
          <span class="detail-value">{{ data.processing.startedAt | date:'medium' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fin</span>
          <span class="detail-value">{{ data.processing.completedAt | date:'medium' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Duración</span>
          <span class="detail-value">{{ formatDuration(data.processing.duration) }}</span>
        </div>
      </div>
      @if (data.processing.parameters) {
        <div class="detail-section">
          <h3>Parámetros</h3>
          <pre class="detail-params">{{ data.processing.parameters | json }}</pre>
        </div>
      }
      @if (data.processing.errorMessage) {
        <div class="detail-section error">
          <h3>Error</h3>
          <p class="error-message">{{ data.processing.errorMessage }}</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px 0; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
    .detail-value { font-size: 13px; color: #1a1a2e; }
    .progress-text { font-size: 11px; color: #94a3b8; margin-top: 2px; display: block; }
    .detail-section { margin-top: 16px; }
    .detail-section h3 { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
    .detail-params { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; max-height: 160px; overflow: auto; }
    .detail-section.error { background: #fef2f2; padding: 12px; border-radius: 8px; }
    .error-message { color: #dc2626; font-size: 13px; margin: 0; }
  `],
})
export class ProcessingDetailDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { processing: ProcessingHistory }) {}

  getStatusColor(): string {
    const colors: Record<string, string> = { completed: 'primary', failed: 'warn', running: 'accent', pending: 'basic' };
    return colors[this.data.processing.status] || 'basic';
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}
