import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StationsModule } from './modules/stations/stations.module';
import { CalculationsModule } from './modules/calculations/calculations.module';
import { HistoryModule } from './modules/history/history.module';
import { ExportModule } from './modules/export/export.module';
import { AdminModule } from './modules/admin/admin.module';
import { NewsModule } from './modules/news/news.module';
import { PremiumModule } from './modules/premium/premium.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CoordinateConversionModule } from './modules/coordinate-conversion/coordinate-conversion.module';
import { RinexAnalysisModule } from './modules/rinex-analysis/rinex-analysis.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqljs');
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'colgnss_user'),
            password: configService.get<string>('DB_PASSWORD', 'colgnss_pass'),
            database: configService.get<string>('DB_DATABASE', 'colgnss_db'),
            ssl: { rejectUnauthorized: false },
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
            synchronize: true,
            logging: configService.get<string>('NODE_ENV') === 'development',
            retryAttempts: 3,
          };
        }
        return {
          type: 'sqljs',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
          autoLoadEntities: true,
          location: configService.get<string>('DB_PATH', 'colgnss_dev.sqlite'),
          autoSave: true,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        }]
      }),
    }),
    AuthModule,
    UsersModule,
    StationsModule,
    CalculationsModule,
    HistoryModule,
    ExportModule,
    AdminModule,
    NewsModule,
    PremiumModule,
    AnalyticsModule,
    CoordinateConversionModule,
    RinexAnalysisModule,
    EnterpriseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
