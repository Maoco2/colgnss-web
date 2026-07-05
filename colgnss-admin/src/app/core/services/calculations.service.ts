import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Calculation, CalculationStats, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CalculationsService {
  private api = inject(ApiService);

  getCalculations(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<Calculation>> {
    return this.api.getPaginated<Calculation>('enterprise/calculations', query);
  }

  getCalculationStats(): Observable<CalculationStats> {
    return this.api.get<any>('enterprise/calculations/stats').pipe(map(r => r.data));
  }

  getCalculation(id: string): Observable<Calculation> {
    return this.api.getById<Calculation>('enterprise/calculations', id).pipe(map(r => r.data));
  }
}
