import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RinexAnalysisController } from './rinex-analysis.controller';
import { RinexAnalysisService } from './rinex-analysis.service';
import { TemporaryFileManagerService } from './temporary-file-manager.service';
import { RinexFileDetectorService } from './rinex-file-detector.service';
import { RinexDecompressorService } from './rinex-decompressor.service';
import { RinexNormalizerService } from './rinex-normalizer.service';
import { RinexHeaderParserService } from './rinex-header-parser.service';
import { RinexObservationParserService } from './rinex-observation-parser.service';
import { EpochAnalyzerService } from './rinex-epoch-analyzer.service';
import { EpochParserV2Service } from './epoch-parser-v2.service';
import { EpochParserV3Service } from './epoch-parser-v3.service';
import { SatelliteAnalyzerService } from './rinex-satellite-analyzer.service';
import { QualityAnalyzerService } from './rinex-quality-analyzer.service';
import { CoordinateTransformerService } from './rinex-coordinate-transformer.service';
import { StationLocatorService } from './rinex-station-locator.service';
import { TrackingTimeValidatorService } from './rinex-tracking-time-validator.service';
import { PdfReportGeneratorService } from './rinex-pdf-report-generator.service';
import { SseService } from './rinex-sse.service';
import { ReceiverCatalogService } from './rinex-receiver-catalog.service';
import { AntennaCatalogService } from './rinex-antenna-catalog.service';
import { FileValidatorService } from './rinex-file-validator.service';
import { ObservationAnalyzerService } from './rinex-observation-analyzer.service';
import { RinexAnalysis } from './rinex-analysis.entity';
import { StationsModule } from '../stations/stations.module';
import { CalculationsModule } from '../calculations/calculations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RinexAnalysis]),
    ScheduleModule.forRoot(),
    StationsModule,
    CalculationsModule,
  ],
  controllers: [RinexAnalysisController],
  providers: [
    RinexAnalysisService,
    TemporaryFileManagerService,
    RinexFileDetectorService,
    RinexDecompressorService,
    RinexNormalizerService,
    RinexHeaderParserService,
    RinexObservationParserService,
    EpochAnalyzerService,
    EpochParserV2Service,
    EpochParserV3Service,
    SatelliteAnalyzerService,
    QualityAnalyzerService,
    CoordinateTransformerService,
    StationLocatorService,
    TrackingTimeValidatorService,
    PdfReportGeneratorService,
    SseService,
    ReceiverCatalogService,
    AntennaCatalogService,
    FileValidatorService,
    ObservationAnalyzerService,
  ],
  exports: [RinexAnalysisService],
})
export class RinexAnalysisModule {}
