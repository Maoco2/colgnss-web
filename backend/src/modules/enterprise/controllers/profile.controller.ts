import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { Calculation } from '../../calculations/calculation.entity';
import { Session } from '../entities/session.entity';
import { UserVisit } from '../entities/user-visit.entity';
import { Download } from '../entities/download.entity';

@ApiTags('Enterprise - Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/profile')
export class ProfileController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserVisit)
    private userVisitRepository: Repository<UserVisit>,
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    @InjectRepository(Download)
    private downloadRepository: Repository<Download>,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile with all stats' })
  async getProfile(@Param('id') id: string): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['country', 'department', 'city', 'enterpriseRole'],
    });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');

    const [sessions, visits, calculations, downloads] = await Promise.all([
      this.sessionRepository.count({ where: { userId: id } }),
      this.userVisitRepository.count({ where: { userId: id } }),
      this.calculationRepository.count({ where: { userId: id } }),
      this.downloadRepository.count({ where: { userId: id } }),
    ]);

    const lastSessions = await this.sessionRepository.find({
      where: { userId: id },
      order: { loginAt: 'DESC' },
      take: 10,
    });
    const lastCalculations = await this.calculationRepository.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return ApiResponse.ok({
      user,
      stats: { sessions, visits, calculations, downloads },
      lastSessions,
      lastCalculations,
    });
  }
}
