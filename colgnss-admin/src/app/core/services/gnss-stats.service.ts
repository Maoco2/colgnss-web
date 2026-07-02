import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class GnssStatsService {
  private api = inject(ApiService);

  getConstellationStats(): Observable<any> {
    return this.api.get<any>('enterprise/gnss/constellations');
  }

  getGnssOverview(): Observable<any> {
    return this.api.get<any>('enterprise/gnss/overview');
  }
}
