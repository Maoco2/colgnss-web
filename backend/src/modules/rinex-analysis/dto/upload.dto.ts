import { IsOptional, IsString } from 'class-validator';

export class UploadDto {
  @IsOptional()
  @IsString()
  sessionId?: string;
}
