import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { DataWarehouseEntry, DataWarehouseSummary } from '@core/models';

@Injectable({ providedIn: 'root' })
export class DataWarehouseService {
  private api = inject(ApiService);

  getEntries(query?: Record<string, string | number | boolean | undefined>): Observable<DataWarehouseEntry[]> {
    return this.api.get<DataWarehouseEntry[]>('enterprise/data-warehouse', query).pipe(map(r => r.data));
  }

  getSummary(): Observable<DataWarehouseSummary> {
    return this.api.get<DataWarehouseSummary>('enterprise/data-warehouse/summary').pipe(map(r => r.data));
  }
}
