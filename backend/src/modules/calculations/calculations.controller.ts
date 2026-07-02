import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalculationsService } from './calculations.service';
import { CalculateTrackingTimeDto } from './dto/calculate-tracking-time.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Calculations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calculations')
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Post('tracking-time')
  @ApiOperation({ summary: 'Calculate minimum tracking time' })
  async calculate(
    @CurrentUser() user: any,
    @Body() dto: CalculateTrackingTimeDto,
  ) {
    const result = await this.calculationsService.calculate(user.sub, dto);
    return ApiResponse.ok(result, 'Calculation completed successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get user calculation history' })
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.calculationsService.findByUser(user.sub, page, limit);
    return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get calculation by ID' })
  async findOne(@Param('id') id: string) {
    const calc = await this.calculationsService.findById(id);
    return ApiResponse.ok(calc);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calculation' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.calculationsService.delete(id, user.sub);
    return ApiResponse.ok(null, 'Calculation deleted');
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all user calculations' })
  async clearAll(@CurrentUser() user: any) {
    await this.calculationsService.deleteAll(user.sub);
    return ApiResponse.ok(null, 'All calculations deleted');
  }
}
