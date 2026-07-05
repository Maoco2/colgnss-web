import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CalculationsService } from '@core/services/calculations.service';
import { Calculation, CalculationStats } from '@core/models';

@Component({
  selector: 'app-calculations',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatSnackBarModule, MatTooltipModule, MatProgressBarModule, FormsModule,
  ],
  templateUrl: './calculations.component.html',
  styleUrls: ['./calculations.component.scss'],
})
export class CalculationsComponent implements OnInit {
  private calculationsService = inject(CalculationsService);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['userName', 'trackingTime', 'networkType', 'station1Name', 'distance1', 'createdAt'];
  dataSource = new MatTableDataSource<Calculation>([]);

  loading = signal(true);
  searchQuery = signal('');

  totalCount = signal(0);
  todayCount = signal(0);
  avgTime = signal(0);

  networkTypes = ['ACTIVE', 'PASSIVE', 'MIXED', 'COMPARISON'];

  ngOnInit(): void {
    this.loadCalculations();
    this.loadStats();
  }

  loadCalculations(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = { page: 1, limit: 50 };

    this.calculationsService.getCalculations(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.totalCount.set(response.meta?.total || response.data?.length || 0);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar cálculos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  loadStats(): void {
    this.calculationsService.getCalculationStats().subscribe({
      next: (stats) => {
        this.todayCount.set(stats?.today ?? 0);
        this.avgTime.set(Math.round(stats?.avgTime ?? 0));
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

  formatDistance(km?: number): string {
    if (km == null) return '\u2014';
    return `${km.toFixed(2)} km`;
  }

  getNetworkColor(type: string): string {
    const colors: Record<string, string> = {
      ACTIVE: '#22c55e',
      PASSIVE: '#3b82f6',
      MIXED: '#a855f7',
      COMPARISON: '#f97316',
    };
    return colors[type] || '#94a3b8';
  }
}
