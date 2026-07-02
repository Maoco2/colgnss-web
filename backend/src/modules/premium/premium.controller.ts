import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Premium')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('premium')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get premium subscription status' })
  async getStatus(@CurrentUser() user: any) {
    const status = await this.premiumService.getPremiumStatus(user.sub);
    return ApiResponse.ok(status);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate premium subscription' })
  async activate(@CurrentUser() user: any) {
    const result = await this.premiumService.activatePremium(user.sub, 'manual-payment');
    return ApiResponse.ok(result, 'Premium activated');
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel premium subscription' })
  async cancel(@CurrentUser() user: any) {
    const result = await this.premiumService.cancelPremium(user.sub);
    return ApiResponse.ok(result, 'Premium cancelled');
  }

  @Get('features')
  @ApiOperation({ summary: 'Get premium features list' })
  async getFeatures() {
    const features = await this.premiumService.getPremiumFeatures();
    return ApiResponse.ok(features);
  }
}
