import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Advertisement } from '../entities/advertisement.entity';
import { AdvertisementClick } from '../entities/advertisement-click.entity';

class CreateAdDto {
  title: string;
  type: string;
  platform: string;
  code?: string;
  imageUrl?: string;
  linkUrl?: string;
  width?: number;
  height?: number;
  campaignName?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

class UpdateAdDto {
  title?: string;
  description?: string;
  type?: string;
  platform?: string;
  code?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  campaignName?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

@ApiTags('Enterprise - Advertising')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/advertising')
export class AdvertisingController {
  constructor(
    @InjectRepository(Advertisement)
    private adRepository: Repository<Advertisement>,
    @InjectRepository(AdvertisementClick)
    private adClickRepository: Repository<AdvertisementClick>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all advertisements' })
  async findAll(): Promise<ApiResponse<any>> {
    const data = await this.adRepository.find({ order: { createdAt: 'DESC' } });
    return ApiResponse.ok(data);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Advertisement performance stats' })
  async getStats(): Promise<ApiResponse<any>> {
    const totalAds = await this.adRepository.count();
    const activeAds = await this.adRepository.count({ where: { isActive: true } });
    const totalClicks = await this.adClickRepository.count();
    const totalImpressions = await this.adRepository
      .createQueryBuilder('a')
      .select('SUM(a.totalImpressions)', 'total')
      .getRawOne();
    const totalRevenue = await this.adRepository
      .createQueryBuilder('a')
      .select('SUM(a.revenue)', 'total')
      .getRawOne();
    const avgCtr = await this.adRepository
      .createQueryBuilder('a')
      .select('AVG(a.ctr)', 'avg')
      .getRawOne();

    return ApiResponse.ok({
      totalAds,
      activeAds,
      totalClicks,
      totalImpressions: totalImpressions?.total || 0,
      totalRevenue: totalRevenue?.total || 0,
      avgCtr: avgCtr?.avg || 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const ad = await this.adRepository.findOne({ where: { id } });
    if (!ad) return ApiResponse.error('Advertisement not found', 'NOT_FOUND');
    return ApiResponse.ok(ad);
  }

  @Post()
  @ApiOperation({ summary: 'Create advertisement' })
  async create(@Body() dto: CreateAdDto): Promise<ApiResponse<any>> {
    const ad = this.adRepository.create(dto as any);
    const saved = await this.adRepository.save(ad);
    return ApiResponse.ok(saved, 'Advertisement created');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update advertisement' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdDto): Promise<ApiResponse<any>> {
    const ad = await this.adRepository.findOne({ where: { id } });
    if (!ad) return ApiResponse.error('Advertisement not found', 'NOT_FOUND');
    await this.adRepository.update(id, dto as any);
    const updated = await this.adRepository.findOne({ where: { id } });
    return ApiResponse.ok(updated, 'Advertisement updated');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete advertisement' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.adRepository.delete(id);
    if (result.affected === 0) return ApiResponse.error('Advertisement not found', 'NOT_FOUND');
    return ApiResponse.ok(null, 'Advertisement deleted');
  }
}


