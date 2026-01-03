import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { SocietyType, SocietyStatus } from '@prisma/client';

export class UpdateSocietyDto {
  @ApiProperty({
    description: 'Society name',
    example: 'Green View Apartments',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Address line 1',
    example: 'MG Road, Phase 2',
    required: false,
  })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiProperty({
    description: 'City',
    example: 'Bengaluru',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'State',
    example: 'Karnataka',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Pincode (6 digits)',
    example: '560001',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode?: string;

  @ApiProperty({
    description: 'Society type',
    enum: SocietyType,
    example: SocietyType.APARTMENT,
    required: false,
  })
  @IsEnum(SocietyType, { message: 'Invalid society type' })
  @IsOptional()
  societyType?: SocietyType;

  @ApiProperty({
    description: 'Society status',
    enum: SocietyStatus,
    example: SocietyStatus.ACTIVE,
    required: false,
  })
  @IsEnum(SocietyStatus, { message: 'Invalid society status' })
  @IsOptional()
  status?: SocietyStatus;
}

