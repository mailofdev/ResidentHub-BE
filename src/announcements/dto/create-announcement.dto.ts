import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement title',
    example: 'Monthly Society Meeting',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    description: 'Announcement content',
    example: 'The monthly society meeting will be held on December 20th at 6 PM in the community hall.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @ApiProperty({
    description: 'Mark as important',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isImportant?: boolean;

  @ApiProperty({
    description: 'Expiration date (optional)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString({}, { message: 'Expires at must be a valid date string' })
  @IsOptional()
  expiresAt?: string;
}

