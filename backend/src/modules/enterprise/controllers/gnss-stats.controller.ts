import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { SatelliteStatistics } from '../entities/satellite-statistics.entity';
import { ProcessingHistory } from '../entities/processing-history.entity';

@ApiTags('Enterprise - GNSS Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/gnss')
export class GnssStatsController {
  constructor(
    @InjectRepository(SatelliteStatistics)
    private satelliteStatsRepository: Repository<SatelliteStatistics>,
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
  ) {}

  @Get('constellations')
  @ApiOperation({ summary: 'GNSS constellation statistics' })
  async getConstellationStats(): Promise<ApiResponse<any>> {
    const stats = await this.satelliteStatsRepository.find({
      order: { usageFrequency: 'DESC' },
    });
    const totalFiles = await this.processingRepository.count();
    return ApiResponse.ok({ constellations: stats, totalFiles });
  }

  @Get('overview')
  @ApiOperation({ summary: 'GNSS overview metrics' })
  async getOverview(): Promise<ApiResponse<any>> {
    const avgSatellites = await this.processingRepository
      .createQueryBuilder('p')
      .select('AVG(p.avgSatellites)', 'avg')
      .getRawOne();
    const maxSimultaneous = await this.processingRepository
      .createQueryBuilder('p')
      .select('MAX(p.maxSimultaneous)', 'max')
      .getRawOne();
    const totalObservations = await this.processingRepository
      .createQueryBuilder('p')
      .select('SUM(p.observations)', 'total')
      .getRawOne();
    const totalEpochs = await this.processingRepository
      .createQueryBuilder('p')
      .select('SUM(p.epochs)', 'total')
      .getRawOne();

    return ApiResponse.ok({
      avgSatellites: avgSatellites?.avg || 0,
      maxSimultaneous: maxSimultaneous?.max || 0,
      totalObservations: totalObservations?.total || 0,
      totalEpochs: totalEpochs?.total || 0,
    });
  }
}

