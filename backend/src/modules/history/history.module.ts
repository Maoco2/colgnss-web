import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { Calculation } from '../calculations/calculation.entity';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [TypeOrmModule.forFeature([Calculation]), ExportModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
