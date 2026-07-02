import { PartialType } from '@nestjs/swagger';
import { CreateAlertConfigDto } from './create-alert-config.dto';

export class UpdateAlertConfigDto extends PartialType(CreateAlertConfigDto) {}
