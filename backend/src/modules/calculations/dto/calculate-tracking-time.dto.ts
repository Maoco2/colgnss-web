import { IsNumber, IsEnum, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NetworkType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  MIXED = 'mixed',
  COMPARISON = 'comparison',
}

export class CalculateTrackingTimeDto {
  @ApiProperty({ example: 4.711 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -74.072 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ enum: NetworkType })
  @IsEnum(NetworkType)
  networkType: NetworkType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isDualFrequency?: boolean = true;
}
