import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { UnitType, OwnershipType } from '@prisma/client';

export class CreateUnitDto {
  @ApiProperty({
    description: 'Building name / Block / Wing',
    example: 'Block A',
  })
  @IsString()
  @IsNotEmpty({ message: 'Building name is required' })
  buildingName: string;

  @ApiProperty({
    description: 'Unit number / Flat number',
    example: 'A-203',
  })
  @IsString()
  @IsNotEmpty({ message: 'Unit number is required' })
  unitNumber: string;

  @ApiProperty({
    description: 'Floor number',
    example: 2,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Min(0, { message: 'Floor number must be 0 or greater' })
  floorNumber?: number;

  @ApiProperty({
    description: 'Unit type',
    enum: UnitType,
    example: UnitType.TWO_BHK,
  })
  @IsEnum(UnitType, { message: 'Invalid unit type' })
  @IsNotEmpty({ message: 'Unit type is required' })
  unitType: UnitType;

  @ApiProperty({
    description: 'Area in square feet',
    example: 1200.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Area must be greater than 0' })
  areaSqFt?: number;

  @ApiProperty({
    description: 'Ownership type',
    enum: OwnershipType,
    example: OwnershipType.OWNER,
  })
  @IsEnum(OwnershipType, { message: 'Invalid ownership type' })
  @IsNotEmpty({ message: 'Ownership type is required' })
  ownershipType: OwnershipType;
}

