import { ApiProperty } from '@nestjs/swagger';

export class Item {
  @ApiProperty({ description: 'The unique identifier of the item', example: 1 })
  id: number;

  @ApiProperty({ description: 'The name of the item', example: 'Laptop' })
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

  @ApiProperty({
    description: 'The date when the item was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the item was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

