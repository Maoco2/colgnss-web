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

  getProcessings(params?: Record<string, string | number | boolean | undefined>): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/processings', params).pipe(map(r => r.data));
  }

  getProcessingsByModule(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/processings-by-module').pipe(map(r => r.data));
  }

  getProcessingsByRinex(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/processings-by-rinex').pipe(map(r => r.data));
  }

  getProcessingsByConstellation(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/processings-by-constellation').pipe(map(r => r.data));
  }

  getProcessingsByCountry(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/processings-by-country').pipe(map(r => r.data));
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

  getAvgProcessingTime(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/avg-processing-time').pipe(map(r => r.data));
  }

  getErrorsDaily(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/errors-daily').pipe(map(r => r.data));
  }

  getFilesProcessed(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/analytics/files-processed').pipe(map(r => r.data));
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
