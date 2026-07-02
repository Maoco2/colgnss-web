import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <div class="login-header">
      <mat-icon class="login-icon">satellite_alt</mat-icon>
      <h2>ColGnss Admin</h2>
      <p class="text-muted">Inicia sesión para continuar</p>
    </div>
    <form (ngSubmit)="onLogin()" class="login-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Usuario</mat-label>
        <input matInput type="text" [(ngModel)]="username" name="username" required />
        <mat-icon matPrefix>person</mat-icon>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Contraseña</mat-label>
        <input matInput type="password" [(ngModel)]="password" name="password" required />
        <mat-icon matPrefix>lock</mat-icon>
      </mat-form-field>
      @if (error()) {
        <div class="login-error">{{ error() }}</div>
      }
      <button mat-raised-button color="primary" type="submit" class="full-width login-btn" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
        }
        {{ loading() ? 'Ingresando...' : 'Iniciar sesión' }}
      </button>
    </form>
  `,
  styles: [`
    .login-header { text-align: center; margin-bottom: 32px; }
    .login-icon { font-size: 48px; width: 48px; height: 48px; color: var(--secondary); }
    h2 { margin: 12px 0 4px; font-size: 22px; font-weight: 700; color: var(--text-primary); }
    .login-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .login-btn { height: 48px; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-spinner { display: inline-block; }
    .login-error { color: #ef4444; font-size: 13px; text-align: center; padding: 4px 0; }
  `],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onLogin(): void {
    if (!this.username || !this.password) {
      this.error.set('Ingrese usuario y contraseña');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.message || 'Credenciales inválidas';
        this.error.set(msg);
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
