import { Controller, Get, Post, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoordinateConversionService } from './coordinate-conversion.service';
import { ConvertPointDto } from './dto/convert-point.dto';
import { BatchConvertDto } from './dto/batch-convert.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Coordinate Conversion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coordinate')
export class CoordinateConversionController {
  constructor(private readonly service: CoordinateConversionService) {}

  @Get('reference-systems')
  @ApiOperation({ summary: 'Get available reference systems' })
  getReferenceSystems() {
    return ApiResponse.ok(this.service.getReferenceSystems());
  }

  @Get('coordinate-types')
  @ApiOperation({ summary: 'Get coordinate types for a system' })
  getCoordinateTypes(@Query('systemId', ParseIntPipe) systemId: number) {
    return ApiResponse.ok(this.service.getCoordinateTypes(systemId));
  }

  @Get('gauss-zones')
  @ApiOperation({ summary: 'Get Gauss-Kruger zones for a system' })
  getGaussZones(@Query('systemId', ParseIntPipe) systemId: number) {
    return ApiResponse.ok(this.service.getGaussZones(systemId));
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get departments from IGAC database' })
  getDepartments() {
    return ApiResponse.ok(this.service.getDepartments());
  }

  @Get('municipalities')
  @ApiOperation({ summary: 'Get municipalities by department' })
  getMunicipalities(@Query('departmentId', ParseIntPipe) departmentId: number) {
    return ApiResponse.ok(this.service.getMunicipalities(departmentId));
  }

  @Get('origins')
  @ApiOperation({ summary: 'Get local cartographic origins' })
  getOrigins(
    @Query('systemId', ParseIntPipe) systemId: number,
    @Query('municipalityPk') municipalityPk?: string,
  ) {
    return ApiResponse.ok(this.service.getOrigins(systemId, municipalityPk ? parseInt(municipalityPk) : undefined));
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert a single coordinate point' })
  async convertPoint(@CurrentUser() user: any, @Body() dto: ConvertPointDto) {
    const result = await this.service.convertPoint(user.sub, dto);
    return ApiResponse.ok(result);
  }

  @Post('batch-convert')
  @ApiOperation({ summary: 'Batch convert coordinates from a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async batchConvert(
    @CurrentUser() user: any,
    @Body() dto: BatchConvertDto,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const result = await this.service.batchConvert(user.sub, dto, file);
    return ApiResponse.ok(result);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get coordinate conversion history' })
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.service.getHistory(user.sub, page || 1, limit || 20);
    return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
  }
}
