import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { UserRole } from '../users/user.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboard() {
    const stats = await this.adminService.getDashboardStats();
    return ApiResponse.ok(stats);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin)' })
  async getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.adminService.getUsers(page, limit);
    return ApiResponse.paginated(result.data as any[], result.total, result.page, result.limit);
  }
}
