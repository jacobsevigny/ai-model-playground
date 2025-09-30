import { Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll() {
    return this.prisma.session.findMany({
      include: { runs: true },
    });
  }

  @Post('seed')
  async seed() {
    const session = await this.prisma.session.create({
      data: {
        runs: {
          create: [
            {
              model: 'gpt-4o',
              prompt: 'Hello world',
              output: 'Hi there!',
              tokens: 10,
              cost: 0.002,
            },
          ],
        },
      },
      include: { runs: true },
    });
    return session;
  }
}
