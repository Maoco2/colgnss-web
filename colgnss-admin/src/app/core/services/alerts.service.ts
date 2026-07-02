import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { AlertConfig, AlertEvent, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private api = inject(ApiService);

  getAlertConfigs(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<AlertConfig>> {
    return this.api.getPaginated<AlertConfig>('enterprise/alerts/config', query);
  }

  getAlertConfig(id: string): Observable<AlertConfig> {
    return this.api.getById<AlertConfig>('enterprise/alerts/config', id).pipe(map(r => r.data));
  }

  createAlertConfig(data: Partial<AlertConfig>): Observable<AlertConfig> {
    return this.api.post<AlertConfig>('enterprise/alerts/config', data).pipe(map(r => r.data));
  }

  updateAlertConfig(id: string, data: Partial<AlertConfig>): Observable<AlertConfig> {
    return this.api.put<AlertConfig>('enterprise/alerts/config', id, data).pipe(map(r => r.data));
  }

  deleteAlertConfig(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/alerts/config', id).pipe(map(() => undefined));
  }

  getAlertEvents(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<AlertEvent>> {
    return this.api.getPaginated<AlertEvent>('enterprise/alerts/events', query);
  }

  acknowledgeAlert(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/alerts/events/${id}/acknowledge`).pipe(map(() => undefined));
  }

  resolveAlert(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/alerts/events/${id}/acknowledge`).pipe(map(() => undefined));
  }
}
