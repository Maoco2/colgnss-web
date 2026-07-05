import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { EnterpriseService } from '../enterprise.service';
import { ApiResponse } from '../../../common/dto/api-response.dto';

@ApiTags('Enterprise - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/dashboard')
export class DashboardController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard KPI cards' })
  async getDashboardCards(): Promise<ApiResponse<any>> {
    const data = await this.enterpriseService.getDashboardStats();
    return ApiResponse.ok(data);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user registration stats' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  async getUserStats(@Query('period') period?: string): Promise<ApiResponse<any>> {
    const data = await this.enterpriseService.getUserStats((period as any) || 'monthly');
    return ApiResponse.ok(data);
  }

  @Get('processing')
  @ApiOperation({ summary: 'Get calculation statistics (formerly processing)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'] })
  async getCalculationStats(@Query('period') period?: string): Promise<ApiResponse<any>> {
    const data = await this.enterpriseService.getCalculationStats((period as any) || 'monthly');
    return ApiResponse.ok(data);
  }

  @Get('server')
  @ApiOperation({ summary: 'Get server health metrics' })
  async getServerMetrics(): Promise<ApiResponse<any>> {
    const data = await this.enterpriseService.getServerMetrics();
    return ApiResponse.ok(data);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get BI KPI indicators' })
  async getKpis(): Promise<ApiResponse<any>> {
    const data = await this.enterpriseService.getKpis();
    return ApiResponse.ok(data);
  }
}

