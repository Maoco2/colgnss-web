import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ActivityLog } from '../entities/activity-log.entity';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@ApiTags('Enterprise - Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/audit')
export class AuditController {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Paginated audit log' })
  async findAll(@Query() query: PaginationQueryDto): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const [data, total] = await this.activityLogRepository.findAndCount({
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return ApiResponse.paginated(data, total, page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Audit log by user' })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.activityLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return ApiResponse.paginated(data, total, page, limit);
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Audit log by action type' })
  async findByAction(
    @Param('action') action: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.activityLogRepository.findAndCount({
      where: { action },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return ApiResponse.paginated(data, total, page, limit);
  }
}


