import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { PaginatedResponse } from '@core/models';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Ocurrió un error inesperado';
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }
    return throwError(() => ({ status: error.status, message, errors: error.error?.errors }));
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<T>>(this.buildUrl(path), { params: httpParams }).pipe(catchError(e => this.handleError(e)));
  }

  getPaginated<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<T[]>>(this.buildUrl(path), { params: httpParams }).pipe(
      map(res => ({
        data: res.data,
        meta: res.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
      })),
      catchError(e => this.handleError(e))
    );
  }

  getById<T>(path: string, id: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.buildUrl(path)}/${id}`).pipe(catchError(e => this.handleError(e)));
  }

  post<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(path), body).pipe(catchError(e => this.handleError(e)));
  }

  put<T>(path: string, id: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.buildUrl(path)}/${id}`, body).pipe(catchError(e => this.handleError(e)));
  }

  patch<T>(path: string, id: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.buildUrl(path)}/${id}`, body).pipe(catchError(e => this.handleError(e)));
  }

  delete<T = void>(path: string, id?: string): Observable<ApiResponse<T>> {
    const url = id ? `${this.buildUrl(path)}/${id}` : this.buildUrl(path);
    return this.http.delete<ApiResponse<T>>(url).pipe(catchError(e => this.handleError(e)));
  }
}
