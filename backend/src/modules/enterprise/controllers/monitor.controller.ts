import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ServerMetric } from '../entities/server-metric.entity';

@ApiTags('Enterprise - Monitor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/monitor')
export class MonitorController {
  constructor(
    @InjectRepository(ServerMetric)
    private serverMetricRepository: Repository<ServerMetric>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Current server status' })
  async getCurrentStatus(): Promise<ApiResponse<any>> {
    const latest = await this.serverMetricRepository
      .createQueryBuilder('m')
      .orderBy('m.created_at', 'DESC')
      .getOne();
    const avgMetrics = await this.serverMetricRepository
      .createQueryBuilder('m')
      .select('AVG(m.cpu_usage)', 'avgCpu')
      .addSelect('AVG(m.ram_usage)', 'avgRam')
      .addSelect('AVG(m.disk_usage)', 'avgDisk')
      .addSelect('AVG(m.api_response_time)', 'avgResponseTime')
      .getRawOne();
    return ApiResponse.ok({ latest, averages: avgMetrics });
  }

  @Get('history')
  @ApiOperation({ summary: 'Historical server metrics' })
  @ApiQuery({ name: 'limit', required: false })
  async getHistory(@Query('limit') limit?: number): Promise<ApiResponse<any>> {
    const data = await this.serverMetricRepository
      .createQueryBuilder('m')
      .orderBy('m.created_at', 'DESC')
      .take(limit || 100)
      .getMany();
    return ApiResponse.ok(data);
  }
}

