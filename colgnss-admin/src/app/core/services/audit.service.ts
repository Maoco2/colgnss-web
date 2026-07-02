import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private api = inject(ApiService);

  getAuditLogs(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated<any>('enterprise/audit', query);
  }

  getAuditByUser(userId: string): Observable<any> {
    return this.api.get<any>(`enterprise/audit/user/${userId}`);
  }

  getAuditByAction(action: string): Observable<any> {
    return this.api.get<any>(`enterprise/audit/action/${action}`);
  }
}
