import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationsService } from '@core/services/notifications.service';
import { Notification } from '@core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, MatTabsModule, MatFormFieldModule, MatSelectModule,
    MatBadgeModule, MatDialogModule, MatInputModule, MatTooltipModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  private notificationsService = inject(NotificationsService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  notifications = signal<Notification[]>([]);
  selectedTab = signal(0);
  selectedCategory = signal('all');
  unreadCount = signal(0);
  categories = ['all', 'info', 'success', 'warning', 'error'];

  filteredNotifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.notificationsService.getNotifications().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.notifications.set(list);
        this.applyFilter();
      },
      error: () => {},
    });
    this.notificationsService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 400);
  }

  applyFilter(): void {
    let list = this.notifications();
    if (this.selectedTab() === 1) list = list.filter((n) => !n.isRead);
    if (this.selectedCategory() !== 'all') list = list.filter((n) => n.type === this.selectedCategory());
    this.filteredNotifications.set(list);
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
    this.applyFilter();
  }

  onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat);
    this.applyFilter();
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;
    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
        this.applyFilter();
      },
      error: () => {},
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
        this.applyFilter();
      },
      error: () => {},
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateNotificationDialog, { width: '500px' });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.notificationsService.createNotification(result).subscribe({
          next: () => this.loadData(),
          error: () => {},
        });
      }
    });
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };
    return map[type] || 'notifications';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = { info: '#3b82f6', success: '#22c55e', warning: '#f97316', error: '#ef4444' };
    return map[type] || '#64748b';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
  }
}

@Component({
  selector: 'app-create-notification',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Nueva Notificación</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select #type>
            <mat-option value="info">Info</mat-option>
            <mat-option value="success">Success</mat-option>
            <mat-option value="warning">Warning</mat-option>
            <mat-option value="error">Error</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select #category>
            <mat-option value="general">General</mat-option>
            <mat-option value="system">Sistema</mat-option>
            <mat-option value="user">Usuario</mat-option>
            <mat-option value="billing">Facturación</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput #title>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Mensaje</mat-label>
          <textarea matInput #message rows="4"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Usuario ID (opcional)</mat-label>
          <input matInput #userId>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="{
        type: type.value, title: title.value, message: message.value, userId: userId.value || undefined, icon: type.value
      }">Crear</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 16px; min-width: 400px; padding-top: 8px; }
  `],
})
export class CreateNotificationDialog {}
