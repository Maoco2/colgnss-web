import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuditService } from '@core/services/audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatDatepickerModule,
    MatNativeDateModule, MatChipsModule, MatDividerModule, MatExpansionModule,
  ],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
})
export class AuditComponent implements OnInit {
  private auditService = inject(AuditService);

  loading = signal(true);
  logs = signal<any[]>([]);
  totalEvents = signal(0);
  eventsToday = signal(0);
  mostCommonAction = signal('');
  uniqueUsers = signal(0);
  expandedRow = signal<string | null>(null);

  selectedAction = signal('all');
  selectedEntity = signal('all');
  searchUser = signal('');
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  actionTypes = ['all', 'login', 'logout', 'create', 'update', 'delete', 'export', 'view', 'download', 'upload'];
  entityTypes = ['all', 'user', 'station', 'processing', 'report', 'advertisement', 'subscription', 'settings', 'notification'];

  displayedColumns = ['timestamp', 'user', 'action', 'entity', 'details', 'ip'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {};
    if (this.selectedAction() !== 'all') params['action'] = this.selectedAction();
    if (this.selectedEntity() !== 'all') params['entity'] = this.selectedEntity();
    if (this.searchUser()) params['search'] = this.searchUser();
    if (this.startDate()) params['from'] = this.startDate()!.toISOString();
    if (this.endDate()) params['to'] = this.endDate()!.toISOString();

    this.auditService.getAuditLogs(params).subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        this.logs.set(data);
        this.computeStats(data);
      },
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 400);
  }

  private computeStats(data: any[]): void {
    this.totalEvents.set(data.length);
    const today = new Date().toDateString();
    this.eventsToday.set(data.filter((d) => new Date(d.createdAt).toDateString() === today).length);
    const actionCounts: Record<string, number> = {};
    const users = new Set<string>();
    data.forEach((d) => {
      actionCounts[d.action] = (actionCounts[d.action] || 0) + 1;
      if (d.userName || d.userId) users.add(d.userName || d.userId);
    });
    const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
    this.mostCommonAction.set(topAction ? topAction[0] : '—');
    this.uniqueUsers.set(users.size);
  }

  toggleRow(id: string): void {
    this.expandedRow.set(this.expandedRow() === id ? null : id);
  }

  exportLogs(): void {
    const data = this.logs();
    const csv = [
      ['Timestamp', 'Usuario', 'Acción', 'Entidad', 'Detalles', 'IP'].join(','),
      ...data.map((d) =>
        [d.createdAt, d.userName || '', d.action, d.entity, (d.description || '').replace(/,/g, ';'), d.ip || ''].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  applyFilters(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.selectedAction.set('all');
    this.selectedEntity.set('all');
    this.searchUser.set('');
    this.startDate.set(null);
    this.endDate.set(null);
    this.loadData();
  }

  getActionColor(action: string): string {
    const map: Record<string, string> = {
      create: 'primary', update: 'accent', delete: 'warn',
      login: 'primary', logout: '', view: '', export: '',
    };
    return map[action] || '';
  }
}
