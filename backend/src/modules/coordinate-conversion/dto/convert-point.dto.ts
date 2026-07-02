import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class ConvertPointDto {
  @IsNumber()
  sourceSystemId: number;

  @IsString()
  sourceCoordType: string;

  @IsOptional()
  @IsNumber()
  sourceOriginId?: number;

  @IsNumber()
  targetSystemId: number;

  @IsString()
  targetCoordType: string;

  @IsOptional()
  @IsNumber()
  targetOriginId?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon?: number;

  @IsOptional()
  @IsNumber()
  h?: number;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  z?: number;

  @IsOptional()
  @IsNumber()
  north?: number;

  @IsOptional()
  @IsNumber()
  east?: number;
}
