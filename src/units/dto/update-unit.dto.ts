import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { UnitType, OwnershipType, UnitStatus } from '@prisma/client';

export class UpdateUnitDto {
  @ApiProperty({
    description: 'Building name / Block / Wing',
    example: 'Block A',
    required: false,
  })
  @IsString()
  @IsOptional()
  buildingName?: string;

  @ApiProperty({
    description: 'Unit number / Flat number',
    example: 'A-203',
    required: false,
  })
  @IsString()
  @IsOptional()
  unitNumber?: string;

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
    required: false,
  })
  @IsEnum(UnitType, { message: 'Invalid unit type' })
  @IsOptional()
  unitType?: UnitType;

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
    required: false,
  })
  @IsEnum(OwnershipType, { message: 'Invalid ownership type' })
  @IsOptional()
  ownershipType?: OwnershipType;

  @ApiProperty({
    description: 'Unit status',
    enum: UnitStatus,
    example: UnitStatus.OCCUPIED,
    required: false,
  })
  @IsEnum(UnitStatus, { message: 'Invalid unit status' })
  @IsOptional()
  status?: UnitStatus;
}

