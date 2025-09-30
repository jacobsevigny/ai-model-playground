import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SessionController } from './session.controller';

@Module({
  controllers: [SessionController],
  providers: [PrismaService],
})
export class AppModule {}
