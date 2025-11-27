import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({
    description: 'The name of the item',
    example: 'Laptop',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the item',
    example: 'A high-performance laptop for development',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The price of the item',
    example: 1299.99,
    required: false,
  })
  price?: number;
}

