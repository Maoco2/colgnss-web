import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  private api = inject(ApiService);

  getReceivers(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated<any>('enterprise/catalogs/receivers', query);
  }

  getReceiver(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/catalogs/receivers', id).pipe(map(r => r.data));
  }

  createReceiver(data: any): Observable<any> {
    return this.api.post<any>('enterprise/catalogs/receivers', data).pipe(map(r => r.data));
  }

  updateReceiver(id: string, data: any): Observable<any> {
    return this.api.put<any>('enterprise/catalogs/receivers', id, data).pipe(map(r => r.data));
  }

  deleteReceiver(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/catalogs/receivers', id).pipe(map(() => undefined));
  }

  getAntennas(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated<any>('enterprise/catalogs/antennas', query);
  }

  getAntenna(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/catalogs/antennas', id).pipe(map(r => r.data));
  }

  createAntenna(data: any): Observable<any> {
    return this.api.post<any>('enterprise/catalogs/antennas', data).pipe(map(r => r.data));
  }

  updateAntenna(id: string, data: any): Observable<any> {
    return this.api.put<any>('enterprise/catalogs/antennas', id, data).pipe(map(r => r.data));
  }

  deleteAntenna(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/catalogs/antennas', id).pipe(map(() => undefined));
  }

  getManufacturers(): Observable<any> {
    return this.api.get<any>('enterprise/catalogs/manufacturers');
  }

  getManufacturerRanking(): Observable<any> {
    return this.api.get<any>('enterprise/catalogs/manufacturers');
  }

  getFirmwares(): Observable<any> {
    return this.api.get<any>('enterprise/catalogs/firmwares');
  }

  getRinexVersions(): Observable<any> {
    return this.api.get<any>('enterprise/catalogs/rinex-versions');
  }

  getCrxVersions(): Observable<any> {
    return this.api.get<any>('enterprise/catalogs/crx-versions');
  }
}
