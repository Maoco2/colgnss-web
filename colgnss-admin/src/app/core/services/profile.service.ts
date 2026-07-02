import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '@core/models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(ApiService);

  getProfile(id: string): Observable<User> {
    return this.api.getById<User>('enterprise/profile', id).pipe(map(r => r.data));
  }

  getProfileStats(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/profile', id).pipe(map(r => r.data.stats));
  }

  getProfileActivity(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/profile', id).pipe(map(r => ({ lastSessions: r.data.lastSessions, lastProcessings: r.data.lastProcessings })));
  }
}
