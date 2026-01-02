import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({
    description: 'Unit ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'Invalid unit ID format' })
  @IsNotEmpty({ message: 'Unit ID is required' })
  unitId: string;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  @IsNotEmpty({ message: 'Month is required' })
  month: number;

  @ApiProperty({
    description: 'Year',
    example: 2024,
    minimum: 2000,
  })
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000, { message: 'Year must be 2000 or later' })
  @IsNotEmpty({ message: 'Year is required' })
  year: number;

  @ApiProperty({
    description: 'Maintenance amount',
    example: 5000.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({
    description: 'Due date',
    example: '2024-12-31T00:00:00Z',
  })
  @IsDateString({}, { message: 'Due date must be a valid date string' })
  @IsNotEmpty({ message: 'Due date is required' })
  dueDate: string;

  @ApiProperty({
    description: 'Notes (optional)',
    example: 'Monthly maintenance for December',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

