import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiProperty()
  @IsString()
  value: string;
}
