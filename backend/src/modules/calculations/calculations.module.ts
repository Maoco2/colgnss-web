import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationsController } from './calculations.controller';
import { CalculationsService } from './calculations.service';
import { Calculation } from './calculation.entity';
import { User } from '../users/user.entity';
import { StationsModule } from '../stations/stations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Calculation, User]), StationsModule],
  controllers: [CalculationsController],
  providers: [CalculationsService],
  exports: [CalculationsService],
})
export class CalculationsModule {}
