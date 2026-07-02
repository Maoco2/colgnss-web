import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ServerMetric } from '../entities/server-metric.entity';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(ServerMetric)
    private serverMetricRepository: Repository<ServerMetric>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();
    const method = request.method;
    const endpoint = request.route?.path || request.url;

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - start;
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        const metric = this.serverMetricRepository.create({
          timestamp: new Date(),
          cpuUsage: 0,
          ramUsage: 0,
          diskUsage: 0,
          apiResponseTime: responseTime,
          activeConnections: 0,
          totalRequests: 1,
          errorCount: statusCode >= 400 ? 1 : 0,
        });
        this.serverMetricRepository.save(metric).catch(() => {});
      }),
    );
  }
}
