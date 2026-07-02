import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Subscription } from '../entities/subscription.entity';

@ApiTags('Enterprise - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/subscriptions')
export class SubscriptionsController {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions' })
  async findAll(): Promise<ApiResponse<any>> {
    const data = await this.subscriptionRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return ApiResponse.ok(data);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Subscription metrics' })
  async getStats(): Promise<ApiResponse<any>> {
    const total = await this.subscriptionRepository.count();
    const active = await this.subscriptionRepository.count({ where: { status: 'active' } });
    const canceled = await this.subscriptionRepository.count({ where: { status: 'canceled' } });
    const expired = await this.subscriptionRepository.count({ where: { status: 'expired' } });
    const trial = await this.subscriptionRepository.count({ where: { status: 'trial' } });
    const byPlan = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.plan')
      .getRawMany();
    const totalRevenue = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('SUM(s.price)', 'total')
      .getRawOne();
    const monthlyRecurring = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('SUM(s.price)', 'total')
      .where("s.plan = 'monthly' AND s.status = 'active'")
      .getRawOne();

    return ApiResponse.ok({
      total, active, canceled, expired, trial,
      byPlan, totalRevenue: totalRevenue?.total || 0,
      mrr: monthlyRecurring?.total || 0,
    });
  }
}


