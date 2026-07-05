import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Calculation } from '../../calculations/calculation.entity';
import { Session } from '../entities/session.entity';
import { UserVisit } from '../entities/user-visit.entity';
import { Download } from '../entities/download.entity';
import { StationStatistics } from '../entities/station-statistics.entity';
import { ReceiverStatistics } from '../entities/receiver-statistics.entity';
import { AntennaStatistics } from '../entities/antenna-statistics.entity';
import { SatelliteStatistics } from '../entities/satellite-statistics.entity';

@ApiTags('Enterprise - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/analytics')
export class AnalyticsController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserVisit)
    private userVisitRepository: Repository<UserVisit>,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
    @InjectRepository(StationStatistics)
    private stationStatsRepository: Repository<StationStatistics>,
    @InjectRepository(ReceiverStatistics)
    private receiverStatsRepository: Repository<ReceiverStatistics>,
    @InjectRepository(AntennaStatistics)
    private antennaStatsRepository: Repository<AntennaStatistics>,
    @InjectRepository(SatelliteStatistics)
    private satelliteStatsRepository: Repository<SatelliteStatistics>,
  ) {}

  @Get('users-registered')
  @ApiOperation({ summary: 'Users registered by month' })
  async getUsersRegistered(): Promise<ApiResponse<any>> {
    const data = await this.userRepository
      .createQueryBuilder('u')
      .select("strftime('%Y-%m', u.created_at)", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('users-active')
  @ApiOperation({ summary: 'Daily active users' })
  async getUsersActive(): Promise<ApiResponse<any>> {
    const data = await this.sessionRepository
      .createQueryBuilder('s')
      .select("strftime('%Y-%m-%d', s.login_at)", 'date')
      .addSelect('COUNT(DISTINCT s.userId)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .limit(30)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('users-active-hourly')
  @ApiOperation({ summary: 'Hourly active users distribution' })
  async getUsersActiveHourly(): Promise<ApiResponse<any>> {
    const data = await this.sessionRepository
      .createQueryBuilder('s')
      .select("strftime('%H', s.login_at)", 'hour')
      .addSelect('COUNT(DISTINCT s.userId)', 'count')
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('calculations')
  @ApiOperation({ summary: 'Calculation counts by period' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'] })
  async getCalculations(@Query('period') period?: string): Promise<ApiResponse<any>> {
    const format = period === 'yearly' ? '%Y' : period === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
    const data = await this.calculationRepository
      .createQueryBuilder('c')
      .select(`strftime('${format}', c.created_at)`, 'period')
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('calculations-by-network')
  @ApiOperation({ summary: 'Calculations grouped by network type' })
  async getCalculationsByNetwork(): Promise<ApiResponse<any>> {
    const data = await this.calculationRepository
      .createQueryBuilder('c')
      .select('c.network_type', 'networkType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.network_type')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('avg-calculation-time')
  @ApiOperation({ summary: 'Average tracking time over time' })
  async getAvgCalculationTime(): Promise<ApiResponse<any>> {
    const data = await this.calculationRepository
      .createQueryBuilder('c')
      .select("strftime('%Y-%m-%d', c.created_at)", 'date')
      .addSelect('AVG(c.tracking_time)', 'avgTime')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .limit(30)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('calculations-made')
  @ApiOperation({ summary: 'Calculations made over time' })
  async getCalculationsMade(): Promise<ApiResponse<any>> {
    const data = await this.calculationRepository
      .createQueryBuilder('c')
      .select("strftime('%Y-%m-%d', c.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .limit(30)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('files-downloaded')
  @ApiOperation({ summary: 'Files downloaded over time' })
  async getFilesDownloaded(): Promise<ApiResponse<any>> {
    const data = await this.downloadRepository
      .createQueryBuilder('d')
      .select("strftime('%Y-%m-%d', d.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .limit(30)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('top-users')
  @ApiOperation({ summary: 'Top users by calculation count' })
  async getTopUsers(): Promise<ApiResponse<any>> {
    const data = await this.calculationRepository
      .createQueryBuilder('c')
      .select('c.user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.user_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const enriched = await Promise.all(data.map(async (item) => {
      const user = await this.userRepository.findOne({ where: { id: item.userId } });
      return { ...item, userName: user?.fullName || user?.email || 'Unknown' };
    }));
    return ApiResponse.ok(enriched);
  }

  @Get('top-stations')
  @ApiOperation({ summary: 'Top stations by processing count' })
  async getTopStations(): Promise<ApiResponse<any>> {
    const data = await this.stationStatsRepository.find({
      order: { totalProcessings: 'DESC' },
      take: 10,
      relations: ['station'],
    });
    return ApiResponse.ok(data);
  }

  @Get('top-receivers')
  @ApiOperation({ summary: 'Top receivers by usage' })
  async getTopReceivers(): Promise<ApiResponse<any>> {
    const data = await this.receiverStatsRepository.find({
      order: { totalUses: 'DESC' },
      take: 10,
    });
    return ApiResponse.ok(data);
  }

  @Get('top-antennas')
  @ApiOperation({ summary: 'Top antennas by usage' })
  async getTopAntennas(): Promise<ApiResponse<any>> {
    const data = await this.antennaStatsRepository.find({
      order: { totalUses: 'DESC' },
      take: 10,
    });
    return ApiResponse.ok(data);
  }

  @Get('top-constellations')
  @ApiOperation({ summary: 'Top constellations by usage' })
  async getTopConstellations(): Promise<ApiResponse<any>> {
    const data = await this.satelliteStatsRepository.find({
      order: { usageFrequency: 'DESC' },
      take: 10,
    });
    return ApiResponse.ok(data);
  }

  @Get('top-countries')
  @ApiOperation({ summary: 'Top countries by calculation' })
  async getTopCountries(): Promise<ApiResponse<any>> {
    return ApiResponse.ok([]);
  }

  @Get('errors-daily')
  @ApiOperation({ summary: 'Daily error counts' })
  async getErrorsDaily(): Promise<ApiResponse<any>> {
    return ApiResponse.ok([]);
  }
}
