import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ProcessingHistory } from '../entities/processing-history.entity';
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
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
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

  @Get('processings')
  @ApiOperation({ summary: 'Processing counts by period' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'] })
  async getProcessings(@Query('period') period?: string): Promise<ApiResponse<any>> {
    const format = period === 'yearly' ? '%Y' : period === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select(`strftime('${format}', p.created_at)`, 'period')
      .addSelect('COUNT(*)', 'count')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('processings-by-module')
  @ApiOperation({ summary: 'Processings grouped by module' })
  async getProcessingsByModule(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.fileType', 'module')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.fileType')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('processings-by-rinex')
  @ApiOperation({ summary: 'Processings by RINEX version' })
  async getProcessingsByRinex(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.fileVersion', 'version')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.fileVersion')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('processings-by-constellation')
  @ApiOperation({ summary: 'Processings by constellation' })
  async getProcessingsByConstellation(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.constellations', 'constellation')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.constellations')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('processings-by-country')
  @ApiOperation({ summary: 'Processings by country' })
  async getProcessingsByCountry(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.country')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('errors-daily')
  @ApiOperation({ summary: 'Daily error counts' })
  async getErrorsDaily(): Promise<ApiResponse<any>> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select("strftime('%Y-%m-%d', p.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('p.status = :status', { status: 'error' })
      .andWhere('p.createdAt >= :start', { start: thirtyDaysAgo })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('avg-processing-time')
  @ApiOperation({ summary: 'Average processing time over time' })
  async getAvgProcessingTime(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select("strftime('%Y-%m-%d', p.created_at)", 'date')
      .addSelect('AVG(p.duration)', 'avgTime')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .limit(30)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('files-processed')
  @ApiOperation({ summary: 'Files processed over time' })
  async getFilesProcessed(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select("strftime('%Y-%m-%d', p.created_at)", 'date')
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
  @ApiOperation({ summary: 'Top users by processing count' })
  async getTopUsers(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.userId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
    return ApiResponse.ok(data);
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

  @Get('top-countries')
  @ApiOperation({ summary: 'Top countries by processing' })
  async getTopCountries(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();
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
}

