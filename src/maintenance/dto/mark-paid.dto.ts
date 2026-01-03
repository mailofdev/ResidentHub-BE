import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkPaidDto {
  @ApiProperty({
    description: 'Payment notes',
    example: 'Payment received via cash on 2024-12-15',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

