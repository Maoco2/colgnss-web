import { Controller, Get, Post, Put, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { AlertConfig } from '../entities/alert-config.entity';
import { AlertEvent } from '../entities/alert-event.entity';
import { CreateAlertConfigDto } from '../dto/create-alert-config.dto';
import { UpdateAlertConfigDto } from '../dto/update-alert-config.dto';

@ApiTags('Enterprise - Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/alerts')
export class AlertsController {
  constructor(
    @InjectRepository(AlertConfig)
    private alertConfigRepository: Repository<AlertConfig>,
    @InjectRepository(AlertEvent)
    private alertEventRepository: Repository<AlertEvent>,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'List alert configurations' })
  async getConfigs(): Promise<ApiResponse<any>> {
    const data = await this.alertConfigRepository.find({ order: { createdAt: 'DESC' } });
    return ApiResponse.ok(data);
  }

  @Post('config')
  @ApiOperation({ summary: 'Create alert configuration' })
  async createConfig(@Body() dto: CreateAlertConfigDto): Promise<ApiResponse<any>> {
    const config = this.alertConfigRepository.create(dto as any);
    const saved = await this.alertConfigRepository.save(config);
    return ApiResponse.ok(saved, 'Alert config created');
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update alert configuration' })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdateAlertConfigDto): Promise<ApiResponse<any>> {
    const config = await this.alertConfigRepository.findOne({ where: { id } });
    if (!config) return ApiResponse.error('Alert config not found', 'NOT_FOUND');
    await this.alertConfigRepository.update(id, dto as any);
    const updated = await this.alertConfigRepository.findOne({ where: { id } });
    return ApiResponse.ok(updated, 'Alert config updated');
  }

  @Get('events')
  @ApiOperation({ summary: 'Alert event history' })
  async getEvents(): Promise<ApiResponse<any>> {
    const data = await this.alertEventRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
      relations: ['config'],
    });
    return ApiResponse.ok(data);
  }

  @Post('events/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge an alert event' })
  async acknowledge(@Param('id') id: string): Promise<ApiResponse<any>> {
    const event = await this.alertEventRepository.findOne({ where: { id } });
    if (!event) return ApiResponse.error('Alert event not found', 'NOT_FOUND');
    event.acknowledgedAt = new Date();
    await this.alertEventRepository.save(event);
    return ApiResponse.ok(event, 'Alert acknowledged');
  }
}


