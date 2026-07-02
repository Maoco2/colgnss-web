import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { ProcessingHistory } from './entities/processing-history.entity';
import { ServerMetric } from './entities/server-metric.entity';
import { Session } from './entities/session.entity';
import { UserVisit } from './entities/user-visit.entity';
import { Download } from './entities/download.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ProcessingStatistics } from './entities/processing-statistics.entity';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
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
    @InjectRepository(ProcessingStatistics)
    private processingStatsRepository: Repository<ProcessingStatistics>,
  ) {}

  async getDashboardStats(): Promise<any> {
    const [totalUsers, activeUsers, verifiedUsers, premiumUsers, totalProcessings,
      successfulProcessings, failedProcessings, todayProcessings, todayUsers,
      totalDownloads, totalSessions, totalVisits, latestMetric] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isVerified: true } }),
      this.userRepository.count({ where: { role: UserRole.PREMIUM } }),
      this.processingRepository.count(),
      this.processingRepository.count({ where: { status: 'completed' } }),
      this.processingRepository.count({ where: { status: 'error' } }),
      this.processingRepository.count({ where: { createdAt: Between(this.todayStart(), new Date()) } }),
      this.userRepository.count({ where: { createdAt: Between(this.todayStart(), new Date()) } }),
      this.downloadRepository.count(),
      this.sessionRepository.count(),
      this.userVisitRepository.count(),
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').getOne(),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, verified: verifiedUsers, premium: premiumUsers, today: todayUsers },
      processings: { total: totalProcessings, successful: successfulProcessings, failed: failedProcessings, today: todayProcessings },
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

  async getProcessingStats(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    const now = new Date();
    const startDate = this.getPeriodStart(now, period);

    const processings = await this.processingRepository
      .createQueryBuilder('p')
      .where('p.created_at >= :start', { start: startDate })
      .andWhere('p.created_at <= :end', { end: now })
      .orderBy('p.created_at', 'ASC')
      .getMany();

    const stats = this.aggregateByPeriod(processings, period, 'createdAt');
    const [total, successful, failed, avgTimeResult, byModule] = await Promise.all([
      this.processingRepository.count(),
      this.processingRepository.count({ where: { status: 'completed' } }),
      this.processingRepository.count({ where: { status: 'error' } }),
      this.processingRepository.createQueryBuilder('p').select('AVG(p.duration)', 'avg').getRawOne(),
      this.processingRepository.createQueryBuilder('p').select('p.fileType', 'module').addSelect('COUNT(*)', 'count').groupBy('p.fileType').getRawMany(),
    ]);

    return { total, successful, failed, avgTime: avgTimeResult?.avg || 0, byModule, timeline: stats };
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
    const [totalUsers, newUsersToday, activeUsers, premiumUsers, totalProcessings,
      processingsToday, successProcessings, totalDownloads, uniqueUsersProcessingRes,
      latestMetric, avgProcessingTimeRes] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { createdAt: Between(todayStart, new Date()) } }),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.PREMIUM } }),
      this.processingRepository.count(),
      this.processingRepository.count({ where: { createdAt: Between(todayStart, new Date()) } }),
      this.processingRepository.count({ where: { status: 'completed' } }),
      this.downloadRepository.count(),
      this.processingRepository.createQueryBuilder('p').select('COUNT(DISTINCT p.userId)', 'count').getRawOne(),
      this.serverMetricRepository.createQueryBuilder('m').orderBy('m.created_at', 'DESC').getOne(),
      this.processingRepository.createQueryBuilder('p').select('AVG(p.duration)', 'avg').where('p.status = :status', { status: 'completed' }).getRawOne(),
    ]);

    const successRate = totalProcessings > 0 ? successProcessings / totalProcessings * 100 : 0;
    const uniqueUsersProcessing = uniqueUsersProcessingRes?.count || 0;

    return {
      totalUsers, newUsersToday, activeUsers, premiumUsers,
      totalProcessings, processingsToday, successRate: Math.round(successRate * 100) / 100,
      avgProcessingTime: avgProcessingTimeRes?.avg || 0,
      totalDownloads, uniqueUsersProcessing,
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
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
