import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StationType } from '../station.entity';

export class CreateStationDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: StationType })
  @IsEnum(StationType)
  type: StationType;

  @ApiProperty()
  @IsString()
  department: string;

  @ApiProperty()
  @IsString()
  municipality: string;

  @ApiProperty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiverType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  antennaType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  influenceRadius?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  monumentationType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rinexUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminEntity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  divipolaCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
