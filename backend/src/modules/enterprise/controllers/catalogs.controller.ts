import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ReceiverStatistics } from '../entities/receiver-statistics.entity';
import { AntennaStatistics } from '../entities/antenna-statistics.entity';
import { ProcessingHistory } from '../entities/processing-history.entity';

@ApiTags('Enterprise - Catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/catalogs')
export class CatalogsController {
  constructor(
    @InjectRepository(ReceiverStatistics)
    private receiverStatsRepository: Repository<ReceiverStatistics>,
    @InjectRepository(AntennaStatistics)
    private antennaStatsRepository: Repository<AntennaStatistics>,
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
  ) {}

  @Get('receivers')
  @ApiOperation({ summary: 'Receiver rankings' })
  async getReceivers(): Promise<ApiResponse<any>> {
    const data = await this.receiverStatsRepository.find({ order: { totalUses: 'DESC' }, take: 50 });
    return ApiResponse.ok(data);
  }

  @Get('antennas')
  @ApiOperation({ summary: 'Antenna rankings' })
  async getAntennas(): Promise<ApiResponse<any>> {
    const data = await this.antennaStatsRepository.find({ order: { totalUses: 'DESC' }, take: 50 });
    return ApiResponse.ok(data);
  }

  @Get('manufacturers')
  @ApiOperation({ summary: 'Manufacturer rankings' })
  async getManufacturers(): Promise<ApiResponse<any>> {
    const receivers = await this.receiverStatsRepository
      .createQueryBuilder('r')
      .select('r.manufacturer', 'manufacturer')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(r.totalUses)', 'totalUses')
      .groupBy('r.manufacturer')
      .orderBy('totalUses', 'DESC')
      .getRawMany();
    return ApiResponse.ok(receivers);
  }

  @Get('firmwares')
  @ApiOperation({ summary: 'Firmware distribution' })
  async getFirmwares(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.receiver', 'firmware')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.receiver')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('rinex-versions')
  @ApiOperation({ summary: 'RINEX version distribution' })
  async getRinexVersions(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.fileVersion', 'version')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.fileVersion')
      .orderBy('count', 'DESC')
      .getRawMany();
    return ApiResponse.ok(data);
  }

  @Get('crx-versions')
  @ApiOperation({ summary: 'CRX version distribution' })
  async getCrxVersions(): Promise<ApiResponse<any>> {
    const data = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.fileVersion', 'version')
      .addSelect('COUNT(*)', 'count')
      .where("p.fileType = 'crx'")
      .groupBy('p.fileVersion')
      .orderBy('count', 'DESC')
      .getRawMany();
    return ApiResponse.ok(data);
  }
}

