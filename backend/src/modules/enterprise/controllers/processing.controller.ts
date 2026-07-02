import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { ProcessingHistory } from '../entities/processing-history.entity';
import { ProcessingStatistics } from '../entities/processing-statistics.entity';

@ApiTags('Enterprise - Processing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/processing')
export class ProcessingController {
  constructor(
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
    @InjectRepository(ProcessingStatistics)
    private processingStatsRepository: Repository<ProcessingStatistics>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List processing history with pagination and filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'fileType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('fileType') fileType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const where: any = {};
    if (search) where.fileName = Like(`%${search}%`);
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (fileType) where.fileType = fileType;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.processingRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user', 'station'],
    });
    return ApiResponse.paginated(data, total, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated processing statistics' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'] })
  async getStats(@Query('period') period?: string): Promise<ApiResponse<any>> {
    const now = new Date();
    let startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    switch (period || 'monthly') {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 5, 0, 1);
        break;
    }

    const total = await this.processingRepository.count();
    const successful = await this.processingRepository.count({ where: { status: 'completed' } });
    const failed = await this.processingRepository.count({ where: { status: 'error' } });
    const avgTime = await this.processingRepository
      .createQueryBuilder('p')
      .select('AVG(p.duration)', 'avg')
      .getRawOne();
    const byType = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.fileType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.fileType')
      .getRawMany();
    const byStatus = await this.processingRepository
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.status')
      .getRawMany();

    const stats = await this.processingStatsRepository.find({
      where: { date: Between(startDate, now) },
      order: { date: 'ASC' },
    });

    return ApiResponse.ok({ total, successful, failed, avgTime: avgTime?.avg || 0, byType, byStatus, timeline: stats });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get processing detail' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const record = await this.processingRepository.findOne({
      where: { id },
      relations: ['user', 'station'],
    });
    if (!record) return ApiResponse.error('Processing record not found', 'NOT_FOUND');
    return ApiResponse.ok(record);
  }
}


