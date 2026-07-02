import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportsService } from '@core/services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatProgressBarModule, MatSnackBarModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  private reportsService = inject(ReportsService);
  private snackBar = inject(MatSnackBar);

  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  downloading = signal<string | null>(null);
  downloadProgress = signal(0);

  reportTypes = [
    {
      id: 'users', icon: 'people', title: 'Usuarios',
      description: 'Exportar listado de usuarios registrados',
      formats: ['csv', 'excel', 'pdf'],
      exportFn: (format: string) => this.reportsService.exportUsers(format, this.getDateFilters()),
    },
    {
      id: 'processings', icon: 'assessment', title: 'Procesamientos',
      description: 'Exportar historial de procesamientos',
      formats: ['csv', 'excel', 'pdf'],
      exportFn: (format: string) => this.reportsService.exportProcessings(format, this.getDateFilters()),
    },
    {
      id: 'audit', icon: 'security', title: 'Auditoría',
      description: 'Exportar registros de auditoría',
      formats: ['csv', 'excel', 'pdf'],
      exportFn: (format: string) => this.reportsService.exportAudit(format, this.getDateFilters()),
    },
    {
      id: 'advertising', icon: 'campaign', title: 'Publicidad',
      description: 'Exportar estadísticas publicitarias',
      formats: ['csv', 'excel'],
      exportFn: (format: string) => this.reportsService.exportAudit(format, { ...this.getDateFilters(), type: 'advertising' }),
    },
    {
      id: 'constellations', icon: 'satellite_alt', title: 'Constelaciones',
      description: 'Exportar datos de constelaciones GNSS',
      formats: ['csv'],
      exportFn: (format: string) => this.reportsService.exportAudit(format, { ...this.getDateFilters(), type: 'constellations' }),
    },
    {
      id: 'satellites', icon: 'satellite', title: 'Satélites',
      description: 'Exportar datos de satélites',
      formats: ['csv'],
      exportFn: (format: string) => this.reportsService.exportAudit(format, { ...this.getDateFilters(), type: 'satellites' }),
    },
  ];

  private getDateFilters(): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    if (this.startDate()) filters['from'] = this.startDate()!.toISOString();
    if (this.endDate()) filters['to'] = this.endDate()!.toISOString();
    return filters;
  }

  exportReport(report: any, format: string): void {
    const key = `${report.id}_${format}`;
    this.downloading.set(key);
    this.downloadProgress.set(0);
    const interval = setInterval(() => {
      this.downloadProgress.update((v) => Math.min(v + 10, 90));
    }, 300);
    const extMap: Record<string, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
    const ext = extMap[format] || format;
    report.exportFn(format).subscribe({
      next: (blob: Blob) => {
        clearInterval(interval);
        this.downloadProgress.set(100);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.id}-report.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open(`${report.title} exportado como ${format.toUpperCase()}`, 'OK', { duration: 3000 });
        setTimeout(() => this.downloading.set(null), 1500);
      },
      error: () => {
        clearInterval(interval);
        this.downloading.set(null);
        this.snackBar.open(`Error al exportar ${report.title}`, 'Cerrar', { duration: 5000 });
      },
    });
  }

  getFormatIcon(format: string): string {
    const map: Record<string, string> = { csv: 'table_chart', excel: 'grid_on', pdf: 'picture_as_pdf' };
    return map[format] || 'file_download';
  }

  getFormatLabel(format: string): string {
    return format.toUpperCase();
  }
}
