import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = inject(ApiService);

  getUsersRegistered(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/users-registered').pipe(map(r => r.data));
  }

  getUsersActive(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/users-active').pipe(map(r => r.data));
  }

  getUsersActiveHourly(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/users-active-hourly').pipe(map(r => r.data));
  }

  getCalculations(params?: Record<string, string | number | boolean | undefined>): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/calculations', params).pipe(map(r => r.data));
  }

  getCalculationsByNetwork(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/calculations-by-network').pipe(map(r => r.data));
  }

  getTopConstellations(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-constellations').pipe(map(r => r.data));
  }

  getTopUsers(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-users').pipe(map(r => r.data));
  }

  getTopStations(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-stations').pipe(map(r => r.data));
  }

  getTopReceivers(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-receivers').pipe(map(r => r.data));
  }

  getTopAntennas(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-antennas').pipe(map(r => r.data));
  }

  getTopCountries(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/top-countries').pipe(map(r => r.data));
  }

  getAvgCalculationTime(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/avg-calculation-time').pipe(map(r => r.data));
  }

  getCalculationsMade(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/calculations-made').pipe(map(r => r.data));
  }

  getFilesDownloaded(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/files-downloaded').pipe(map(r => r.data));
  }

  getSubscriptionStats(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/subscriptions/stats').pipe(map(r => r.data));
  }

  getAdStats(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/advertising/stats').pipe(map(r => r.data));
  }
}
