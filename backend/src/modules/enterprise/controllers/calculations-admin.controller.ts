import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Calculation } from '../../calculations/calculation.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@ApiTags('Enterprise - Calculations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/calculations')
export class CalculationsAdminController {
  constructor(
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all tracking time calculations with pagination' })
  async findAll(@Query() query: PaginationQueryDto): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const where: any = {};
    if (search) {
      where.station1Name = Like(`%${search}%`);
    }

    const [data, total] = await this.calculationRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    const result = data.map(c => ({
      id: c.id,
      userId: c.userId,
      userName: c.user?.fullName || c.user?.email || 'Unknown',
      userEmail: c.user?.email,
      latitude: c.latitude,
      longitude: c.longitude,
      networkType: c.networkType,
      station1Name: c.station1Name,
      station1Code: c.station1Code,
      station2Name: c.station2Name,
      station2Code: c.station2Code,
      distance1: c.distance1,
      distance2: c.distance2,
      trackingTime: c.trackingTime,
      isDualFrequency: c.isDualFrequency,
      method: c.method,
      observations: c.observations,
      createdAt: c.createdAt,
    }));

    return ApiResponse.paginated(result, total, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated calculation statistics' })
  async getStats(): Promise<ApiResponse<any>> {
    const total = await this.calculationRepository.count();
    const today = await this.calculationRepository.count({
      where: { createdAt: Between(this.todayStart(), new Date()) },
    });
    const avgTime = await this.calculationRepository
      .createQueryBuilder('c')
      .select('AVG(c.tracking_time)', 'avg')
      .getRawOne();
    const byNetwork = await this.calculationRepository
      .createQueryBuilder('c')
      .select('c.network_type', 'networkType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.network_type')
      .getRawMany();
    const byUser = await this.calculationRepository
      .createQueryBuilder('c')
      .select('c.user_id', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.user_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return ApiResponse.ok({ total, today, avgTime: avgTime?.avg || 0, byNetwork, byUser });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get calculation detail' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const calc = await this.calculationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!calc) return ApiResponse.error('Calculation not found', 'NOT_FOUND');
    return ApiResponse.ok({
      ...calc,
      userName: calc.user?.fullName || calc.user?.email || 'Unknown',
      userEmail: calc.user?.email,
    });
  }

  private todayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
