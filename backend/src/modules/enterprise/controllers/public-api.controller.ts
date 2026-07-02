import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ApiKey } from '../entities/api-key.entity';
import { ApiUsageLog } from '../entities/api-usage-log.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@ApiTags('Enterprise - Public API')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/api-keys')
export class PublicApiController {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(ApiUsageLog)
    private apiUsageRepository: Repository<ApiUsageLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  async findAll(): Promise<ApiResponse<any>> {
    const data = await this.apiKeyRepository.find({ order: { createdAt: 'DESC' } });
    return ApiResponse.ok(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create API key' })
  async create(@Body() dto: CreateApiKeyDto): Promise<ApiResponse<any>> {
    const key = `colgnss_${crypto.randomBytes(32).toString('hex')}`;
    const apiKey = this.apiKeyRepository.create({
      ...dto,
      key,
      isActive: true,
    });
    const saved = await this.apiKeyRepository.save(apiKey);
    return ApiResponse.ok(saved, 'API key created');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke API key' })
  async revoke(@Param('id') id: string): Promise<ApiResponse<any>> {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) return ApiResponse.error('API key not found', 'NOT_FOUND');
    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
    return ApiResponse.ok(null, 'API key revoked');
  }

  @Get('usage')
  @ApiOperation({ summary: 'API key usage statistics' })
  async getUsage(@Query('keyId') keyId?: string): Promise<ApiResponse<any>> {
    const totalKeys = await this.apiKeyRepository.count();
    const activeKeys = await this.apiKeyRepository.count({ where: { isActive: true } });
    const totalRequests = await this.apiUsageRepository.count();
    const byEndpoint = await this.apiUsageRepository
      .createQueryBuilder('u')
      .select('u.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(u.responseTime)', 'avgTime')
      .groupBy('u.endpoint')
      .orderBy('count', 'DESC')
      .getRawMany();
    const where: any = { order: { createdAt: 'DESC' }, take: 50, relations: ['apiKey'] };
    if (keyId) where.where = { apiKeyId: keyId };
    const recentUsage = await this.apiUsageRepository.find(where);
    return ApiResponse.ok({ totalKeys, activeKeys, totalRequests, byEndpoint, recentUsage });
  }
}


