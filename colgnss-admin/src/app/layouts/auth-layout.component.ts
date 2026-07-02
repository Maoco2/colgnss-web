import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: linear-gradient(135deg, var(--bg-dark) 0%, var(--primary-dark) 100%);
      padding: 20px;
    }
    .auth-card {
      width: 100%; max-width: 420px; background: white;
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
      padding: 40px;
    }
  `],
})
export class AuthLayoutComponent {}
