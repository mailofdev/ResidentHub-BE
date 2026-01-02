import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveResidentDto {
  @ApiProperty({
    description: 'Rejection reason (only used when rejecting)',
    example: 'Invalid documents provided',
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

