import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Subscription, SubscriptionStats, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private api = inject(ApiService);

  getSubscriptions(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<Subscription>> {
    return this.api.getPaginated<Subscription>('enterprise/subscriptions', query);
  }

  getSubscription(id: string): Observable<Subscription> {
    return this.api.getById<Subscription>('enterprise/subscriptions', id).pipe(map(r => r.data));
  }

  getSubscriptionStats(): Observable<SubscriptionStats> {
    return this.api.get<SubscriptionStats>('enterprise/subscriptions/stats').pipe(map(r => r.data));
  }
}
