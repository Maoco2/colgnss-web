import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Station } from '../stations/station.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AdvertisementClick } from './entities/advertisement-click.entity';
import { Advertisement } from './entities/advertisement.entity';
import { AiModel } from './entities/ai-model.entity';
import { AiPrediction } from './entities/ai-prediction.entity';
import { AlertConfig } from './entities/alert-config.entity';
import { AlertEvent } from './entities/alert-event.entity';
import { AnomalyDetection } from './entities/anomaly-detection.entity';
import { AntennaStatistics } from './entities/antenna-statistics.entity';
import { ApiKey } from './entities/api-key.entity';
import { ApiUsageLog } from './entities/api-usage-log.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { DataWarehouse } from './entities/data-warehouse.entity';
import { Department } from './entities/department.entity';
import { Download } from './entities/download.entity';
import { Notification } from './entities/notification.entity';
import { Payment } from './entities/payment.entity';
import { Permission } from './entities/permission.entity';

import { QualityScore } from './entities/quality-score.entity';
import { ReceiverStatistics } from './entities/receiver-statistics.entity';
import { RinexStatistics } from './entities/rinex-statistics.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';
import { SatelliteStatistics } from './entities/satellite-statistics.entity';
import { ServerMetric } from './entities/server-metric.entity';
import { Session } from './entities/session.entity';
import { StationStatistics } from './entities/station-statistics.entity';
import { Subscription } from './entities/subscription.entity';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { UserVisit } from './entities/user-visit.entity';
import { Calculation } from '../calculations/calculation.entity';

import { EnterpriseService } from './enterprise.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';

import { DashboardController } from './controllers/dashboard.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { ProfileController } from './controllers/profile.controller';

import { AnalyticsController } from './controllers/analytics.controller';
import { GnssStatsController } from './controllers/gnss-stats.controller';
import { CatalogsController } from './controllers/catalogs.controller';
import { StationsRankController } from './controllers/stations-rank.controller';
import { MonitorController } from './controllers/monitor.controller';
import { AuditController } from './controllers/audit.controller';
import { AdvertisingController } from './controllers/advertising.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { SettingsController } from './controllers/settings.controller';
import { ReportsController } from './controllers/reports.controller';
import { AiController } from './controllers/ai.controller';
import { DataWarehouseController } from './controllers/data-warehouse.controller';
import { PublicApiController } from './controllers/public-api.controller';
import { AlertsController } from './controllers/alerts.controller';
import { CalculationsAdminController } from './controllers/calculations-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Station,
      ActivityLog,
      AdvertisementClick,
      Advertisement,
      AiModel,
      AiPrediction,
      AlertConfig,
      AlertEvent,
      AnomalyDetection,
      AntennaStatistics,
      ApiKey,
      ApiUsageLog,
      City,
      Country,
      DataWarehouse,
      Department,
      Download,
      Notification,
      Payment,
      Permission,
      QualityScore,
      ReceiverStatistics,
      RinexStatistics,
      RolePermission,
      Role,
      SatelliteStatistics,
      ServerMetric,
      Session,
      StationStatistics,
      Subscription,
      SystemConfiguration,
      UserVisit,
      Calculation,
    ]),
  ],
  controllers: [
    DashboardController,
    UsersAdminController,
    ProfileController,
    AnalyticsController,
    GnssStatsController,
    CatalogsController,
    StationsRankController,
    MonitorController,
    AuditController,
    AdvertisingController,
    SubscriptionsController,
    NotificationsController,
    SettingsController,
    ReportsController,
    AiController,
    DataWarehouseController,
    PublicApiController,
    AlertsController,
    CalculationsAdminController,
  ],
  providers: [
    EnterpriseService,
    PermissionGuard,
    AuditInterceptor,
    MetricsInterceptor,
  ],
  exports: [EnterpriseService],
})
export class EnterpriseModule {}
