import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ResidentType } from '@prisma/client';

export class CreateResidentDto {
  @ApiProperty({
    description: 'Society ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Invalid society ID format' })
  @IsNotEmpty({ message: 'Society ID is required' })
  societyId: string;

  @ApiProperty({
    description: 'Building ID / Building name',
    example: 'Block A',
    required: false,
  })
  @IsString()
  @IsOptional()
  buildingId?: string;

  @ApiProperty({
    description: 'Unit ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'Invalid unit ID format' })
  @IsNotEmpty({ message: 'Unit ID is required' })
  unitId: string;

  @ApiProperty({
    description: 'Resident type',
    enum: ResidentType,
    example: ResidentType.OWNER,
  })
  @IsEnum(ResidentType, { message: 'Invalid resident type' })
  @IsNotEmpty({ message: 'Resident type is required' })
  residentType: ResidentType;

  @ApiProperty({
    description: 'Owner ID (required if residentType is TENANT)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsUUID('4', { message: 'Invalid owner ID format' })
  @IsOptional()
  ownerId?: string;

  @ApiProperty({
    description: 'Resident name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'Resident email',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Resident mobile number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mobile is required' })
  mobile: string;

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
  })
  @IsDateString({}, { message: 'Invalid start date format' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @ApiProperty({
    description: 'End date (optional, mainly for tenants)',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString({}, { message: 'Invalid end date format' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Password for resident login (optional - if provided, creates user account)',
    example: 'SecurePassword123!',
    required: false,
  })
  @IsString()
  @IsOptional()
  password?: string;
}

