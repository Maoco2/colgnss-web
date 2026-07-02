import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { SystemConfig } from '@core/models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(ApiService);

  getAllConfig(): Observable<SystemConfig[]> {
    return this.api.get<SystemConfig[]>('enterprise/settings').pipe(map(r => r.data));
  }

  getConfig(group: string): Observable<SystemConfig[]> {
    return this.api.get<SystemConfig[]>(`enterprise/settings/${group}`).pipe(map(r => r.data));
  }

  updateConfig(key: string, value: unknown): Observable<SystemConfig> {
    return this.api.put<SystemConfig>('enterprise/settings', key, { value }).pipe(map(r => r.data));
  }
}
