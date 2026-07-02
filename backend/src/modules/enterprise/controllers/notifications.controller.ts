import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

@ApiTags('Enterprise - Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications with pagination' })
  async findAll(@Query() query: PaginationQueryDto): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const [data, total] = await this.notificationRepository.findAndCount({
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });
    return ApiResponse.paginated(data, total, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(): Promise<ApiResponse<any>> {
    const count = await this.notificationRepository.count({ where: { isRead: false } });
    return ApiResponse.ok({ count });
  }

  @Post()
  @ApiOperation({ summary: 'Create notification' })
  async create(@Body() dto: CreateNotificationDto): Promise<ApiResponse<any>> {
    const notification = this.notificationRepository.create(dto as any);
    const saved = await this.notificationRepository.save(notification);
    return ApiResponse.ok(saved, 'Notification created');
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string): Promise<ApiResponse<any>> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) return ApiResponse.error('Notification not found', 'NOT_FOUND');
    notification.isRead = true;
    await this.notificationRepository.save(notification);
    return ApiResponse.ok(notification, 'Marked as read');
  }
}


