import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { IssueStatus, IssuePriority } from '@prisma/client';

export class UpdateIssueDto {
  @ApiProperty({
    description: 'Issue status',
    enum: IssueStatus,
    example: IssueStatus.IN_PROGRESS,
    required: false,
  })
  @IsEnum(IssueStatus, { message: 'Invalid issue status' })
  @IsOptional()
  status?: IssueStatus;

  @ApiProperty({
    description: 'Issue priority',
    enum: IssuePriority,
    example: IssuePriority.HIGH,
    required: false,
  })
  @IsEnum(IssuePriority, { message: 'Invalid priority' })
  @IsOptional()
  priority?: IssuePriority;

  @ApiProperty({
    description: 'Resolution notes (required when resolving)',
    example: 'Fixed the water leakage by replacing the pipe. Issue resolved.',
    required: false,
  })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

