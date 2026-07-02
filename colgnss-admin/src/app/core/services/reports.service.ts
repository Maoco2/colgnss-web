import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private baseUrl = environment.apiUrl;

  private downloadBlob(path: string, format: string, filters?: Record<string, unknown>): Observable<Blob> {
    const params = new URLSearchParams({ format, ...filters as any });
    const url = `${this.baseUrl}/${path}?${params}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  exportUsers(format: string, filters?: Record<string, unknown>): Observable<Blob> {
    return this.downloadBlob('enterprise/reports/users', format, filters);
  }

  exportProcessings(format: string, filters?: Record<string, unknown>): Observable<Blob> {
    return this.downloadBlob('enterprise/reports/processings', format, filters);
  }

  exportAudit(format: string, filters?: Record<string, unknown>): Observable<Blob> {
    return this.downloadBlob('enterprise/reports/audit', format, filters);
  }

  getReports(query?: Record<string, string | number | boolean | undefined>): Observable<any> {
    return this.api.get<any>('enterprise/reports', query).pipe(map(r => r.data));
  }

  downloadReport(id: string): Observable<ApiResponse<any>> {
    return this.api.get<any>(`enterprise/reports/${id}/download`);
  }
}
