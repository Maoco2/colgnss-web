import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ActivityLog } from '../entities/activity-log.entity';

export const AUDIT_ACTION_KEY = 'audit_action';
export const AUDIT_ENTITY_KEY = 'audit_entity';

export const AuditAction = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
export const AuditEntity = (entity: string) => SetMetadata(AUDIT_ENTITY_KEY, entity);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.sub || user?.id || null;
    const method = request.method;
    const path = request.route?.path || request.url;
    const action = method === 'GET' ? 'read' : method === 'POST' ? 'create' : method === 'PUT' ? 'update' : method === 'DELETE' ? 'delete' : 'other';
    const entity = this.reflector.get<string>(AUDIT_ENTITY_KEY, context.getHandler()) || path.split('/').pop() || 'unknown';
    const customAction = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    const ip = request.ip || request.connection?.remoteAddress || null;
    const userAgent = request.headers?.['user-agent'] || null;

    return next.handle().pipe(
      tap(() => {
        if (!userId) return;
        const log = this.activityLogRepository.create({
          userId,
          action: customAction || `${action}:${entity}`,
          entity,
          entityId: request.params?.id || null,
          details: { method, path },
          ip,
          userAgent,
        });
        this.activityLogRepository.save(log).catch(() => {});
      }),
    );
  }
}
