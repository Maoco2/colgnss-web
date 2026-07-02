import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiKey, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private api = inject(ApiService);

  getApiKeys(): Observable<ApiKey[]> {
    return this.api.get<ApiKey[]>('enterprise/api-keys').pipe(map(r => r.data));
  }

  createApiKey(data: Partial<ApiKey>): Observable<ApiKey> {
    return this.api.post<ApiKey>('enterprise/api-keys', data).pipe(map(r => r.data));
  }

  revokeApiKey(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/api-keys', id).pipe(map(() => undefined));
  }

  getUsageStats(): Observable<any> {
    return this.api.get<any>('enterprise/api-keys/usage').pipe(map(r => r.data));
  }

  getUsageLogs(keyId: string): Observable<any[]> {
    return this.api.get<any>('enterprise/api-keys/usage', { keyId }).pipe(
      map(r => {
        const data = r.data?.recentUsage || [];
        return data.map((log: any) => ({
          ...log,
          timestamp: log.createdAt,
          status: log.statusCode,
        }));
      })
    );
  }
}
