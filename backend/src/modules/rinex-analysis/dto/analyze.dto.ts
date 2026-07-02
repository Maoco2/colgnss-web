import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum NetworkType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  MIXED = 'mixed',
}

export class AnalyzeDto {
  @IsEnum(NetworkType)
  networkType: NetworkType;

  @IsOptional()
  @IsBoolean()
  isDualFrequency?: boolean;
}
