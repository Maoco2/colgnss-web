import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Station } from '../stations/station.entity';
import { Calculation } from '../calculations/calculation.entity';
import { News } from '../news/news.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { StationsModule } from '../stations/stations.module';
import { UsersModule } from '../users/users.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Station, Calculation, News, AuditLog]),
    StationsModule,
    UsersModule,
    NewsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
