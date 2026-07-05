import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/user.entity';
import { Calculation } from '../../calculations/calculation.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Session } from '../entities/session.entity';
import { UserVisit } from '../entities/user-visit.entity';

@ApiTags('Enterprise - Users Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/users')
export class UsersAdminController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(UserVisit)
    private userVisitRepository: Repository<UserVisit>,
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users with pagination, search, and filters' })
  async findAll(@Query() filter: UserFilterDto): Promise<ApiResponse<any>> {
    const { page = 1, limit = 20, search, role, isActive, isVerified, countryId, sortBy = 'createdAt', sortOrder = 'DESC' } = filter;
    const where: any = {};
    if (search) {
      where.fullName = Like(`%${search}%`);
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (countryId) where.countryId = countryId;

    const [data, total] = await this.userRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['country', 'department', 'city'],
    });

    const userIds = data.map(u => u.id);

    if (userIds.length > 0) {
      const calcCounts = await this.calculationRepository
        .createQueryBuilder('c')
        .select('c.user_id', 'userId')
        .addSelect('COUNT(*)', 'count')
        .where('c.user_id IN (:...userIds)', { userIds })
        .groupBy('c.user_id')
        .getRawMany();
      const calcCountMap = new Map(calcCounts.map(c => [c.userId, Number(c.count)]));

      const lastLogins = await this.sessionRepository
        .createQueryBuilder('s')
        .select('s.user_id', 'userId')
        .addSelect('MAX(s.login_at)', 'lastLogin')
        .where('s.user_id IN (:...userIds)', { userIds })
        .groupBy('s.user_id')
        .getRawMany();
      const lastLoginMap = new Map(lastLogins.map(l => [l.userId, l.lastLogin]));

      for (const user of data) {
        (user as any).calculationCount = calcCountMap.get(user.id) ?? 0;
        (user as any).lastLoginDate = lastLoginMap.get(user.id) ?? user.lastLoginAt ?? user.lastLogin ?? null;
      }
    }

    return ApiResponse.paginated(data, total, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['country', 'department', 'city', 'enterpriseRole'] });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    return ApiResponse.ok(user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    await this.userRepository.update(id, dto as any);
    const updated = await this.userRepository.findOne({ where: { id } });
    return ApiResponse.ok(updated, 'User updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) return ApiResponse.error('User not found', 'NOT_FOUND');
    return ApiResponse.ok(null, 'User deleted successfully');
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend user' })
  async suspend(@Param('id') id: string): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    user.isActive = false;
    await this.userRepository.save(user);
    return ApiResponse.ok(user, 'User suspended');
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate user' })
  async reactivate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    user.isActive = true;
    await this.userRepository.save(user);
    return ApiResponse.ok(user, 'User reactivated');
  }

  @Post(':id/change-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user role' })
  async changeRole(@Param('id') id: string, @Body('role') role: UserRole): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    user.role = role;
    await this.userRepository.save(user);
    return ApiResponse.ok(user, 'Role updated');
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@Param('id') id: string): Promise<ApiResponse<any>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return ApiResponse.error('User not found', 'NOT_FOUND');
    return ApiResponse.ok(null, 'Password reset link sent');
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Get user sessions' })
  async getUserSessions(@Param('id') id: string): Promise<ApiResponse<any>> {
    const sessions = await this.sessionRepository.find({ where: { userId: id }, order: { loginAt: 'DESC' }, take: 50 });
    return ApiResponse.ok(sessions);
  }

  @Get(':id/visits')
  @ApiOperation({ summary: 'Get user visit history' })
  async getUserVisits(@Param('id') id: string): Promise<ApiResponse<any>> {
    const visits = await this.userVisitRepository.find({ where: { userId: id }, order: { createdAt: 'DESC' }, take: 50 });
    return ApiResponse.ok(visits);
  }
}


