import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DashboardCard, KPI, UserStats, ProcessingStats, ServerMetrics, ActivityItem } from '@core/models';

interface DashboardRaw {
  users: { total: number; active: number; verified: number; premium: number; today: number };
  processings: { total: number; successful: number; failed: number; today: number };
  server: { cpuUsage: number; ramUsage: number; diskUsage: number; apiResponseTime: number; activeConnections: number; totalRequests: number; errorCount: number; dbConnections: number; dbSize: number };
  downloads: number;
  sessions: number;
  visits: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  getDashboardCards(): Observable<DashboardCard[]> {
    return this.api.get<DashboardRaw>('enterprise/dashboard').pipe(
      map(r => r.data),
      map(d => [
        { id: '1', title: 'Usuarios Totales', value: d.users.total, icon: 'people', color: '#3b82f6', trend: d.users.today, trendLabel: 'hoy' },
        { id: '2', title: 'Procesamientos', value: d.processings.total, icon: 'assessment', color: '#f97316', trend: d.processings.successful, trendLabel: 'exitosos' },
        { id: '3', title: 'CPU', value: Math.round(d.server.cpuUsage), unit: '%', icon: 'memory', color: '#ef4444' },
        { id: '4', title: 'RAM', value: Math.round(d.server.ramUsage), unit: '%', icon: 'storage', color: '#3b82f6' },
        { id: '5', title: 'Descargas', value: d.downloads, icon: 'download', color: '#22c55e' },
        { id: '6', title: 'Sesiones', value: d.sessions, icon: 'session', color: '#a855f7' },
        { id: '7', title: 'Visitas', value: d.visits, icon: 'visibility', color: '#14b8a6' },
        { id: '8', title: 'Tiempo Respuesta', value: Math.round(d.server.apiResponseTime), unit: 'ms', icon: 'timer', color: '#eab308' },
      ])
    );
  }

  getUserStats(period?: string): Observable<UserStats> {
    return this.api.get<any>('enterprise/dashboard/users', { period }).pipe(
      map(r => r.data),
      map(d => ({
        total: d.total,
        active: d.active,
        verified: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        byRole: d.byRole ? Object.fromEntries(d.byRole.map((x: any) => [x.role, x.count])) : {},
        byCountry: d.byCountry ? Object.fromEntries(d.byCountry.map((x: any) => [x.countryId || 'unknown', x.count])) : {},
      }))
    );
  }

  getProcessingStats(): Observable<ProcessingStats> {
    return this.api.get<any>('enterprise/dashboard/processing').pipe(
      map(r => r.data),
      map(d => ({
        total: d.total,
        completed: d.successful,
        failed: d.failed,
        pending: 0,
        running: 0,
        averageTime: d.avgTime,
        totalTime: d.avgTime * d.total,
        byModule: d.byModule ? Object.fromEntries(d.byModule.map((x: any) => [x.module, x.count])) : {},
        byStatus: { successful: d.successful, failed: d.failed },
      }))
    );
  }

  getServerMetrics(): Observable<ServerMetrics> {
    return this.api.get<any>('enterprise/dashboard/server').pipe(
      map(r => r.data),
      map(d => ({
        cpu: d.latest?.cpuUsage ?? d.cpuUsage ?? 0,
        memory: d.latest?.ramUsage ?? d.ramUsage ?? 0,
        disk: d.latest?.diskUsage ?? d.diskUsage ?? 0,
        uptime: 0,
        requestsPerMinute: 0,
        activeConnections: d.latest?.activeConnections ?? d.activeConnections ?? 0,
        lastRestart: d.latest?.createdAt ?? d.createdAt ?? '',
      }))
    );
  }

  getKpis(): Observable<KPI[]> {
    return this.api.get<any>('enterprise/dashboard/kpis').pipe(
      map(r => r.data),
      map(d => [
        { id: '1', label: 'Total Usuarios', value: d.totalUsers, previousValue: 0, change: 0, changeType: 'neutral', period: 'total' },
        { id: '2', label: 'Usuarios Activos Hoy', value: d.newUsersToday, previousValue: 0, change: 0, changeType: 'neutral', period: 'hoy' },
        { id: '3', label: 'Procesamientos', value: d.totalProcessings, previousValue: 0, change: 0, changeType: 'neutral', period: 'total' },
        { id: '4', label: 'Tasa de Éxito', value: Math.round(d.successRate), unit: '%', previousValue: 0, change: 0, changeType: 'neutral', period: 'total' },
        { id: '5', label: 'Tiempo Promedio', value: Math.round(d.avgProcessingTime), unit: 'ms', previousValue: 0, change: 0, changeType: 'neutral', period: 'total' },
        { id: '6', label: 'Descargas', value: d.totalDownloads, previousValue: 0, change: 0, changeType: 'neutral', period: 'total' },
        { id: '7', label: 'CPU', value: Math.round(d.cpuUsage), unit: '%', previousValue: 0, change: 0, changeType: 'neutral', period: 'ahora' },
        { id: '8', label: 'RAM', value: Math.round(d.ramUsage), unit: '%', previousValue: 0, change: 0, changeType: 'neutral', period: 'ahora' },
      ])
    );
  }

  getRecentActivity(limit: number = 10): Observable<ActivityItem[]> {
    return this.api.get<any>('enterprise/audit', { limit: limit.toString(), page: '1' }).pipe(
      map(r => {
        const items = Array.isArray(r) ? r : (r as any).data || [];
        return (items || []).slice(0, limit).map((log: any) => ({
          id: log.id,
          userId: log.userId || '',
          userName: log.user?.fullName || log.user?.email || 'Sistema',
          action: log.action || '',
          entity: log.entity || '',
          entityId: log.entityId,
          details: log.details ? JSON.stringify(log.details) : undefined,
          ip: log.ip,
          createdAt: log.createdAt,
        }));
      })
    );
  }
}
