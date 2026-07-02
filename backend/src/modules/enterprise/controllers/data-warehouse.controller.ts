import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { DataWarehouse } from '../entities/data-warehouse.entity';

@ApiTags('Enterprise - Data Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/data-warehouse')
export class DataWarehouseController {
  constructor(
    @InjectRepository(DataWarehouse)
    private dwRepository: Repository<DataWarehouse>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Query data warehouse' })
  @ApiQuery({ name: 'metric', required: false })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'dimension', required: false })
  @ApiQuery({ name: 'dimensionValue', required: false })
  async query(
    @Query('metric') metric?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('dimension') dimension?: string,
    @Query('dimensionValue') dimensionValue?: string,
  ): Promise<ApiResponse<any>> {
    const where: any = {};
    if (metric) where.metric = metric;
    if (period) where.period = period;
    if (dimension) where.dimension = dimension;
    if (dimensionValue) where.dimensionValue = dimensionValue;
    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }
    const data = await this.dwRepository.find({ where, order: { date: 'ASC' } });
    return ApiResponse.ok(data);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aggregated data warehouse summaries' })
  async getSummary(): Promise<ApiResponse<any>> {
    const byMetric = await this.dwRepository
      .createQueryBuilder('d')
      .select('d.metric', 'metric')
      .addSelect('SUM(d.value)', 'total')
      .addSelect('AVG(d.value)', 'avg')
      .addSelect('MAX(d.value)', 'max')
      .addSelect('MIN(d.value)', 'min')
      .groupBy('d.metric')
      .getRawMany();
    const latestDate = await this.dwRepository
      .createQueryBuilder('d')
      .select('MAX(d.date)', 'latest')
      .getRawOne();
    return ApiResponse.ok({ byMetric, lastUpdated: latestDate?.latest || null });
  }
}


