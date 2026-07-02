import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calculation } from '../calculations/calculation.entity';
import { User } from '../users/user.entity';
import { Station } from '../stations/station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Calculation, User, Station])],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
