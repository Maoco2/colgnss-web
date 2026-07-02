import { IsNumber, IsString, IsOptional } from 'class-validator';

export class BatchConvertDto {
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
  @IsString()
  columnMapping?: string;  // JSON string: {"north":"A","east":"B","height":"C"}
}
