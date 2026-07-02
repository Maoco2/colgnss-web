import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '@core/models';

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/login', { email, password }).pipe(
      map(r => r.data),
      tap(data => {
        localStorage.setItem('access_token', data.token);
        this.currentUserSubject.next(data.user);
      })
    );
  }

  refreshToken(): Observable<{ token: string }> {
    return this.api.post<{ token: string }>('auth/refresh', { token: this.getToken() }).pipe(
      map(r => r.data),
      tap(data => localStorage.setItem('access_token', data.token))
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('auth/me').pipe(
      map(r => r.data),
      tap(data => this.currentUserSubject.next(data))
    );
  }
}
