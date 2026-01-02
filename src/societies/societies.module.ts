import { Module } from '@nestjs/common';
import { SocietiesService } from './societies.service';
import { SocietiesController } from './societies.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocietiesController],
  providers: [SocietiesService],
  exports: [SocietiesService],
})
export class SocietiesModule {}

