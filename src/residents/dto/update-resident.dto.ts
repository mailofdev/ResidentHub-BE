import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';

export class UpdateResidentDto {
  @ApiProperty({
    description: 'Resident name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Resident email',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Resident mobile number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({
    description: 'Emergency contact information',
    example: '+1234567891',
    required: false,
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString({}, { message: 'Invalid start date format' })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date (optional, mainly for tenants)',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString({}, { message: 'Invalid end date format' })
  @IsOptional()
  endDate?: string;
}

