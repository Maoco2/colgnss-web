import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private api = inject(ApiService);

  getCurrentStatus(): Observable<any> {
    return this.api.get<any>('enterprise/monitor');
  }

  getHistory(params?: Record<string, string | number | boolean | undefined>): Observable<any> {
    return this.api.get<any>('enterprise/monitor/history', params);
  }
}
