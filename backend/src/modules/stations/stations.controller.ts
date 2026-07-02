import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ApiResponse } from '../../common/dto/api-response.dto';
import { UserRole } from '../users/user.entity';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all stations with filters' })
  async findAll(@Query() filters: FilterStationDto) {
    const result = await this.stationsService.findAll(filters);
    return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
  }

  @Public()
  @Get('nearest')
  @ApiOperation({ summary: 'Find nearest stations to a point' })
  async findNearest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const stations = await this.stationsService.findNearest(
      parseFloat(lat), parseFloat(lng), type, limit ? parseInt(limit) : 2
    );
    return ApiResponse.ok(stations);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: 'Get station statistics' })
  async getStatistics() {
    const stats = await this.stationsService.getStatistics();
    return ApiResponse.ok(stats);
  }

  @Public()
  @Get('departments')
  @ApiOperation({ summary: 'Get unique departments' })
  async getDepartments() {
    const departments = await this.stationsService.getDepartments();
    return ApiResponse.ok(departments);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID' })
  async findOne(@Param('id') id: string) {
    const station = await this.stationsService.findById(id);
    return ApiResponse.ok(station);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new station (admin)' })
  async create(@Body() dto: CreateStationDto) {
    const station = await this.stationsService.create(dto);
    return ApiResponse.ok(station, 'Station created successfully');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a station (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    const station = await this.stationsService.update(id, dto);
    return ApiResponse.ok(station, 'Station updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a station (admin)' })
  async remove(@Param('id') id: string) {
    await this.stationsService.remove(id);
    return ApiResponse.ok(null, 'Station deleted successfully');
  }
}
