import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';

export class UpdateMaintenanceDto {
  @ApiProperty({
    description: 'Maintenance status',
    enum: MaintenanceStatus,
    example: MaintenanceStatus.PAID,
    required: false,
  })
  @IsEnum(MaintenanceStatus, { message: 'Invalid maintenance status' })
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiProperty({
    description: 'Notes',
    example: 'Payment received via cash',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

