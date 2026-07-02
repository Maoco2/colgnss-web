import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ProcessingHistory, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ProcessingService {
  private api = inject(ApiService);

  getProcessings(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<ProcessingHistory>> {
    return this.api.getPaginated<ProcessingHistory>('enterprise/processing', query);
  }

  getProcessing(id: string): Observable<ProcessingHistory> {
    return this.api.getById<ProcessingHistory>('enterprise/processing', id).pipe(map(r => r.data));
  }

  getProcessingStats(): Observable<any> {
    return this.api.get<any>('enterprise/processing/stats');
  }
}
