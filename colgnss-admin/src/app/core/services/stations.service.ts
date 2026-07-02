import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class StationsService {
  private api = inject(ApiService);

  getTopStations(): Observable<any> {
    return this.api.get<any>('enterprise/stations/top');
  }

  getStation(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/stations', id).pipe(map(r => r.data));
  }
}
