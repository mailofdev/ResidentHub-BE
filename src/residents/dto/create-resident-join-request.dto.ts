import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateResidentJoinRequestDto {
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
    description: 'Password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'Society ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Invalid society ID format' })
  @IsNotEmpty({ message: 'Society ID is required' })
  societyId: string;

  @ApiProperty({
    description: 'Building name / Block / Wing (optional)',
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
}

