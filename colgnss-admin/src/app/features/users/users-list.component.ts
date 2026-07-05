import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '@core/services/users.service';
import { User } from '@core/models';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatDialogModule, MatSnackBarModule, MatTooltipModule,
    MatDividerModule, RouterLink, FormsModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private usersService = inject(UsersService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = ['avatar', 'fullName', 'email', 'role', 'isActive', 'calculations', 'lastLoginAt', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  searchQuery = signal('');
  selectedRole = signal<string>('');
  selectedStatus = signal<string>('');
  loading = signal(true);
  totalUsers = signal(0);

  roles = ['admin', 'user', 'premium', 'moderator', 'viewer'];
  statuses = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'suspended', label: 'Suspendidos' },
    { value: 'pending', label: 'Pendientes' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: 1,
      limit: 50,
    };
    if (this.selectedRole()) params['role'] = this.selectedRole();
    const status = this.selectedStatus();
    if (status === 'active') params['isActive'] = true;
    else if (status === 'suspended') params['isActive'] = false;
    else if (status === 'pending') params['isVerified'] = false;

    this.usersService.getUsers(params).subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.totalUsers.set(response.meta?.total || response.data?.length || 0);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.dataSource.filterPredicate = this.customFilterPredicate();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private customFilterPredicate(): (data: User, filter: string) => boolean {
    return (data: User, filter: string): boolean => {
      const searchStr = filter.toLowerCase();
      return data.fullName.toLowerCase().includes(searchStr) ||
        data.email.toLowerCase().includes(searchStr) ||
        (data.surname?.toLowerCase().includes(searchStr) ?? false);
    };
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery.set(filterValue);
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByRole(role: string): void {
    this.selectedRole.set(role);
    this.loadUsers();
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadUsers();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: { user },
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`¿Eliminar al usuario ${user.fullName}? Esta acción no se puede deshacer.`)) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: () => this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  toggleSuspend(user: User): void {
    const action = user.isActive
      ? this.usersService.suspendUser(user.id)
      : this.usersService.reactivateUser(user.id);
    action.subscribe({
      next: () => {
        this.snackBar.open(user.isActive ? 'Usuario suspendido' : 'Usuario reactivado', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 }),
    });
  }

  changeRole(user: User): void {
    const roles = ['admin', 'user', 'premium', 'moderator', 'viewer'];
    const currentIndex = roles.indexOf(user.role);
    const nextRole = roles[(currentIndex + 1) % roles.length];
    this.usersService.changeUserRole(user.id, nextRole).subscribe({
      next: () => {
        this.snackBar.open(`Rol cambiado a ${nextRole}`, 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Error al cambiar rol', 'Cerrar', { duration: 3000 }),
    });
  }

  resetPassword(user: User): void {
    if (confirm(`¿Resetear contraseña de ${user.fullName}?`)) {
      this.usersService.resetPassword(user.id).subscribe({
        next: () => this.snackBar.open('Contraseña reseteada. Email enviado.', 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al resetear contraseña', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  viewProfile(user: User): void {
    // Navigate to profile - handled by routerLink
  }

  viewHistory(user: User): void {
    this.snackBar.open(`Historial de ${user.fullName}`, 'Cerrar', { duration: 2000 });
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      admin: 'primary',
      premium: 'accent',
      moderator: 'warn',
      user: 'basic',
      viewer: 'basic',
    };
    return colors[role] || 'basic';
  }

  getStatusLabel(user: User): string {
    if (!user.isActive) return 'Suspendido';
    if (!user.isVerified) return 'Pendiente';
    return 'Activo';
  }

  getStatusClass(user: User): string {
    if (!user.isActive) return 'suspended';
    if (!user.isVerified) return 'pending';
    return 'active';
  }
}
