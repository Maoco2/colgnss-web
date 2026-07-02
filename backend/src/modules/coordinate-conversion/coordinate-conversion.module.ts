import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { CoordinateConversionController } from './coordinate-conversion.controller';
import { CoordinateConversionService } from './coordinate-conversion.service';
import { IgacSqliteService } from './igac-sqlite.service';
import { CoordinateTransformerService } from './coordinate-transformer.service';
import { ConversionHistory } from './conversion-history.entity';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversionHistory]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
    ExportModule,
  ],
  controllers: [CoordinateConversionController],
  providers: [CoordinateConversionService, IgacSqliteService, CoordinateTransformerService],
  exports: [CoordinateConversionService],
})
export class CoordinateConversionModule {}
