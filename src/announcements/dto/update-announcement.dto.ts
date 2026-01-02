import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class UpdateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement title',
    example: 'Monthly Society Meeting - Updated',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Announcement content',
    example: 'The monthly society meeting will be held on December 20th at 6 PM in the community hall. Please note the time change.',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Mark as important',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isImportant?: boolean;

  @ApiProperty({
    description: 'Expiration date',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString({}, { message: 'Expires at must be a valid date string' })
  @IsOptional()
  expiresAt?: string;
}

