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

@ApiTags('Enterprise - GNSS Stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/gnss')
export class GnssStatsController {
  constructor(
    @InjectRepository(SatelliteStatistics)
    private satelliteStatsRepository: Repository<SatelliteStatistics>,
  ) {}

  @Get('constellations')
  @ApiOperation({ summary: 'GNSS constellation statistics' })
  async getConstellationStats(): Promise<ApiResponse<any>> {
    const stats = await this.satelliteStatsRepository.find({
      order: { usageFrequency: 'DESC' },
    });
    return ApiResponse.ok({ constellations: stats, totalFiles: 0 });
  }

  @Get('overview')
  @ApiOperation({ summary: 'GNSS overview metrics' })
  async getOverview(): Promise<ApiResponse<any>> {
    return ApiResponse.ok({
      avgSatellites: 0,
      maxSimultaneous: 0,
      totalObservations: 0,
      totalEpochs: 0,
    });
  }
}
