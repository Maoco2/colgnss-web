import { Controller, Get, Put, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { SystemConfiguration } from '../entities/system-configuration.entity';
import { UpdateConfigDto } from '../dto/update-config.dto';
import { CreateConfigDto } from '../dto/create-config.dto';

@ApiTags('Enterprise - Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/settings')
export class SettingsController {
  constructor(
    @InjectRepository(SystemConfiguration)
    private configRepository: Repository<SystemConfiguration>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all system configurations' })
  async findAll(): Promise<ApiResponse<any>> {
    const data = await this.configRepository.find({ order: { key: 'ASC' } });
    return ApiResponse.ok(data);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get configuration by key' })
  async findByKey(@Param('key') key: string): Promise<ApiResponse<any>> {
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config) return ApiResponse.error('Configuration not found', 'NOT_FOUND');
    return ApiResponse.ok(config);
  }

  @Post()
  @ApiOperation({ summary: 'Create configuration' })
  async create(@Body() dto: CreateConfigDto): Promise<ApiResponse<any>> {
    const existing = await this.configRepository.findOne({ where: { key: dto.key } });
    if (existing) return ApiResponse.error('Configuration key already exists', 'CONFLICT');
    const config = this.configRepository.create(dto as any);
    const saved = await this.configRepository.save(config);
    return ApiResponse.ok(saved, 'Configuration created');
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update configuration value' })
  async update(@Param('key') key: string, @Body() dto: UpdateConfigDto): Promise<ApiResponse<any>> {
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config) return ApiResponse.error('Configuration not found', 'NOT_FOUND');
    config.value = dto.value;
    await this.configRepository.save(config);
    return ApiResponse.ok(config, 'Configuration updated');
  }
}


