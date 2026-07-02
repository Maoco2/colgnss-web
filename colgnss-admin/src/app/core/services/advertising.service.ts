import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Advertisement, AdStats, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class AdvertisingService {
  private api = inject(ApiService);

  getAds(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<Advertisement>> {
    return this.api.getPaginated<Advertisement>('enterprise/advertising', query);
  }

  getAd(id: string): Observable<Advertisement> {
    return this.api.getById<Advertisement>('enterprise/advertising', id).pipe(map(r => r.data));
  }

  createAd(data: Partial<Advertisement>): Observable<Advertisement> {
    return this.api.post<Advertisement>('enterprise/advertising', data).pipe(map(r => r.data));
  }

  updateAd(id: string, data: Partial<Advertisement>): Observable<Advertisement> {
    return this.api.put<Advertisement>('enterprise/advertising', id, data).pipe(map(r => r.data));
  }

  deleteAd(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/advertising', id).pipe(map(() => undefined));
  }

  getAdStats(): Observable<AdStats> {
    return this.api.get<AdStats>('enterprise/advertising/stats').pipe(map(r => r.data));
  }
}
