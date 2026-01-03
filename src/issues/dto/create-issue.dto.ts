import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { IssuePriority } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({
    description: 'Issue title',
    example: 'Water leakage in bathroom',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    description: 'Issue description',
    example: 'There is a water leakage in the bathroom sink area. It started yesterday.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({
    description: 'Issue priority',
    enum: IssuePriority,
    example: IssuePriority.HIGH,
    required: false,
  })
  @IsEnum(IssuePriority, { message: 'Invalid priority' })
  @IsOptional()
  priority?: IssuePriority;

  @ApiProperty({
    description: 'Unit ID (optional, for unit-specific issues)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID('4', { message: 'Invalid unit ID format' })
  @IsOptional()
  unitId?: string;
}

