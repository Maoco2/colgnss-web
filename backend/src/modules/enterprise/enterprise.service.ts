import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Calculation } from '../calculations/calculation.entity';
import { ServerMetric } from './entities/server-metric.entity';
import { Session } from './entities/session.entity';
import { UserVisit } from './entities/user-visit.entity';
import { Download } from './entities/download.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    @InjectRepository(ServerMetric)
    private serverMetricRepository: Repository<ServerMetric>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserVisit)
    private userVisitRepository: Repository<UserVisit>,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async getDashboardStats(): Promise<any> {
    const [totalUsers, activeUsers, verifiedUsers, premiumUsers, totalCalculations,
      todayCalculations, todayUsers,
      totalDownloads, totalSessions, totalVisits, latestMetric] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isVerified: true } }),
      this.userRepository.count({ where: { role: UserRole.PREMIUM } }),
      this.calculationRepository.count(),
      this.calculationRepository.count({ where: { createdAt: Between(this.todayStart(), new Date()) } }),
      this.userRepository.count({ where: { createdAt: Between(this.todayStart(), new Date()) } }),
      this.downloadRepository.count(),
      this.sessionRepository.count(),
      this.userVisitRepository.count(),
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').getOne(),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, verified: verifiedUsers, premium: premiumUsers, today: todayUsers },
      calculations: { total: totalCalculations, today: todayCalculations },
      server: latestMetric ? {
        cpuUsage: latestMetric.cpuUsage,
        ramUsage: latestMetric.ramUsage,
        diskUsage: latestMetric.diskUsage,
        apiResponseTime: latestMetric.apiResponseTime,
        activeConnections: latestMetric.activeConnections,
        totalRequests: latestMetric.totalRequests,
        errorCount: latestMetric.errorCount,
        dbConnections: latestMetric.dbConnections,
        dbSize: latestMetric.dbSize,
      } : null,
      downloads: totalDownloads,
      sessions: totalSessions,
      visits: totalVisits,
    };
  }

  async getUserStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    const now = new Date();
    const startDate = this.getPeriodStart(now, period);

    const users = await this.userRepository
      .createQueryBuilder('u')
      .where('u.created_at >= :start', { start: startDate })
      .andWhere('u.created_at <= :end', { end: now })
      .orderBy('u.created_at', 'ASC')
      .getMany();

    const stats = this.aggregateByPeriod(users, period, 'createdAt');
    const [totalUsers, activeUsers, byRole, byCountry] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.createQueryBuilder('user').select('user.role', 'role').addSelect('COUNT(*)', 'count').groupBy('user.role').getRawMany(),
      this.userRepository.createQueryBuilder('user').select('user.countryId', 'countryId').addSelect('COUNT(*)', 'count').groupBy('user.countryId').getRawMany(),
    ]);

    return { total: totalUsers, active: activeUsers, byRole, byCountry, timeline: stats };
  }

  async getCalculationStats(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    const now = new Date();
    const startDate = this.getPeriodStart(now, period);

    const calculations = await this.calculationRepository
      .createQueryBuilder('c')
      .where('c.created_at >= :start', { start: startDate })
      .andWhere('c.created_at <= :end', { end: now })
      .orderBy('c.created_at', 'ASC')
      .getMany();

    const stats = this.aggregateByPeriod(calculations, period, 'createdAt');
    const [total, avgTimeResult, byNetwork] = await Promise.all([
      this.calculationRepository.count(),
      this.calculationRepository.createQueryBuilder('c').select('AVG(c.tracking_time)', 'avg').getRawOne(),
      this.calculationRepository.createQueryBuilder('c').select('c.network_type', 'networkType').addSelect('COUNT(*)', 'count').groupBy('c.network_type').getRawMany(),
    ]);

    return { total, avgTime: avgTimeResult?.avg || 0, byNetwork, timeline: stats };
  }

  async getServerMetrics(): Promise<any> {
    const count = await this.serverMetricRepository.count();
    if (count === 0) {
      return { latest: null, history: [], avgResponseTime: 0 };
    }
    const [latest, history, avgResponseTimeResult] = await Promise.all([
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').getOne(),
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').take(100).getMany(),
      this.serverMetricRepository.createQueryBuilder('m').select('AVG(m.api_response_time)', 'avg').getRawOne(),
    ]);
    return { latest, history, avgResponseTime: avgResponseTimeResult?.avg || 0 };
  }

  async getKpis(): Promise<any> {
    const todayStart = this.todayStart();
    const [totalUsers, newUsersToday, activeUsers, premiumUsers, totalCalculations,
      calculationsToday, totalDownloads, latestMetric, avgTimeRes] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { createdAt: Between(todayStart, new Date()) } }),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.PREMIUM } }),
      this.calculationRepository.count(),
      this.calculationRepository.count({ where: { createdAt: Between(todayStart, new Date()) } }),
      this.downloadRepository.count(),
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').getOne(),
      this.calculationRepository.createQueryBuilder('c').select('AVG(c.tracking_time)', 'avg').getRawOne(),
    ]);

    return {
      totalUsers, newUsersToday, activeUsers, premiumUsers,
      totalCalculations, calculationsToday, avgTrackingTime: avgTimeRes?.avg || 0,
      totalDownloads,
      cpuUsage: latestMetric?.cpuUsage || 0,
      ramUsage: latestMetric?.ramUsage || 0,
      diskUsage: latestMetric?.diskUsage || 0,
      apiResponseTime: latestMetric?.apiResponseTime || 0,
    };
  }

  private todayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getPeriodStart(now: Date, period: string): Date {
    switch (period) {
      case 'daily': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      case 'weekly': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84);
      case 'monthly': return new Date(now.getFullYear() - 1, now.getMonth(), 1);
      case 'yearly': return new Date(now.getFullYear() - 5, 0, 1);
      default: return new Date(now.getFullYear() - 1, now.getMonth(), 1);
    }
  }

  private aggregateByPeriod(items: any[], period: string, dateField: string): any[] {
    const grouped: Record<string, { count: number; items: any[] }> = {};
    for (const item of items) {
      const date = new Date(item[dateField]);
      let key: string;
      switch (period) {
        case 'daily':
          key = date.toISOString().slice(0, 10);
          break;
        case 'weekly':
          key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }
      if (!grouped[key]) grouped[key] = { count: 0, items: [] };
      grouped[key].count++;
      grouped[key].items.push(item);
    }
    return Object.entries(grouped).map(([period, data]) => ({ period, count: data.count }));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
