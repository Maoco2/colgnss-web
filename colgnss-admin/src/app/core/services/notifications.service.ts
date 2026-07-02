import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ApiService } from './api.service';
import { Notification, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getNotifications(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<Notification>> {
    return this.api.getPaginated<Notification>('enterprise/notifications', query);
  }

  createNotification(data: Partial<Notification>): Observable<Notification> {
    return this.api.post<Notification>('enterprise/notifications', data).pipe(map(r => r.data));
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/enterprise/notifications/${id}/read`, {}).pipe(map(() => undefined));
  }

  markAllAsRead(): Observable<void> {
    return this.api.post<void>('enterprise/notifications/read-all').pipe(map(() => undefined));
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<{ count: number }>('enterprise/notifications/unread-count').pipe(map(r => r.data.count));
  }
}
