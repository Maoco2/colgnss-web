import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { StationStatistics } from '../entities/station-statistics.entity';
import { ProcessingHistory } from '../entities/processing-history.entity';

@ApiTags('Enterprise - Station Rankings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/stations')
export class StationsRankController {
  constructor(
    @InjectRepository(StationStatistics)
    private stationStatsRepository: Repository<StationStatistics>,
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
  ) {}

  @Get('top')
  @ApiOperation({ summary: 'Most processed stations' })
  async getTopStations(): Promise<ApiResponse<any>> {
    const data = await this.stationStatsRepository.find({
      order: { totalProcessings: 'DESC' },
      take: 20,
      relations: ['station'],
    });
    return ApiResponse.ok(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Station stats detail' })
  async getStationDetail(@Param('id') id: string): Promise<ApiResponse<any>> {
    const stats = await this.stationStatsRepository.findOne({
      where: { stationId: id },
      relations: ['station'],
    });
    if (!stats) return ApiResponse.error('Station stats not found', 'NOT_FOUND');
    const recentProcessings = await this.processingRepository.find({
      where: { stationId: id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return ApiResponse.ok({ stats, recentProcessings });
  }
}

