import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SessionController } from './session.controller';
import { StreamController } from './stream/stream.controller';
import { StreamService } from './stream/stream.service';

@Module({
  controllers: [SessionController, StreamController],
  providers: [PrismaService, StreamService]
})
export class AppModule {}
