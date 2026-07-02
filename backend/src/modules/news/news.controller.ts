import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { UserRole } from '../users/user.entity';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get published news' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.newsService.findAll(page, limit, true);
    return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  async findOne(@Param('id') id: string) {
    const news = await this.newsService.findById(id);
    return ApiResponse.ok(news);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create news (admin)' })
  async create(@CurrentUser() user: any, @Body() data: any) {
    const news = await this.newsService.create({ ...data, authorId: user.sub });
    return ApiResponse.ok(news, 'News created');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update news (admin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    const news = await this.newsService.update(id, data);
    return ApiResponse.ok(news, 'News updated');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete news (admin)' })
  async remove(@Param('id') id: string) {
    await this.newsService.remove(id);
    return ApiResponse.ok(null, 'News deleted');
  }
}
