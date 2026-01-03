import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AccountStatus } from '@prisma/client';

export class UpdateResidentStatusDto {
  @ApiProperty({
    description: 'New account status',
    enum: AccountStatus,
    example: AccountStatus.SUSPENDED,
  })
  @IsEnum(AccountStatus, { message: 'Invalid account status' })
  @IsNotEmpty({ message: 'Status is required' })
  status: AccountStatus;
}

