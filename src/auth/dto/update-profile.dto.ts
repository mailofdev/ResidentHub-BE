import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'newemail@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;
}

