import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User, Session, UserVisit, PaginatedResponse } from '@core/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);

  getUsers(query?: Record<string, string | number | boolean | undefined>): Observable<PaginatedResponse<User>> {
    return this.api.getPaginated<User>('enterprise/users', query);
  }

  getUser(id: string): Observable<User> {
    return this.api.getById<User>('enterprise/users', id).pipe(map(r => r.data));
  }

  createUser(data: Partial<User>): Observable<User> {
    return this.api.post<User>('enterprise/users', data).pipe(map(r => r.data));
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.api.put<User>('enterprise/users', id, data).pipe(map(r => r.data));
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete<void>('enterprise/users', id).pipe(map(() => undefined));
  }

  suspendUser(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/users/${id}/suspend`).pipe(map(() => undefined));
  }

  reactivateUser(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/users/${id}/reactivate`).pipe(map(() => undefined));
  }

  changeUserRole(id: string, role: string): Observable<void> {
    return this.api.patch<void>('enterprise/users', id, { role }).pipe(map(() => undefined));
  }

  resetPassword(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/users/${id}/reset-password`).pipe(map(() => undefined));
  }

  getUserSessions(id: string): Observable<Session[]> {
    return this.api.get<Session[]>(`enterprise/users/${id}/sessions`).pipe(map(r => r.data));
  }

  getUserVisits(id: string): Observable<UserVisit[]> {
    return this.api.get<UserVisit[]>(`enterprise/users/${id}/visits`).pipe(map(r => r.data));
  }

  getUserProfile(id: string): Observable<any> {
    return this.api.getById<any>('enterprise/users', id).pipe(map(r => r.data));
  }
}
