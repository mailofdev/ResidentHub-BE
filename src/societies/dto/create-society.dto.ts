import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  Matches,
} from 'class-validator';
import { SocietyType } from '@prisma/client';

export class CreateSocietyDto {
  @ApiProperty({
    description: 'Society name',
    example: 'Green View Apartments',
  })
  @IsString()
  @IsNotEmpty({ message: 'Society name is required' })
  name: string;

  @ApiProperty({
    description: 'Address line 1',
    example: 'MG Road, Phase 2',
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  addressLine1: string;

  @ApiProperty({
    description: 'City',
    example: 'Bengaluru',
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'Karnataka',
  })
  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty({
    description: 'Pincode (6 digits)',
    example: '560001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Pincode is required' })
  @Matches(/^\d{6}$/, { message: 'Pincode must be 6 digits' })
  pincode: string;

  @ApiProperty({
    description: 'Society type',
    enum: SocietyType,
    example: SocietyType.APARTMENT,
  })
  @IsEnum(SocietyType, { message: 'Invalid society type' })
  @IsNotEmpty({ message: 'Society type is required' })
  societyType: SocietyType;
}

