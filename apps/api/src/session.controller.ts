import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('sessions')
export class SessionController {
  constructor(private prisma: PrismaService) {}

  // Create a session from user input
  @Post()
  async create(@Body() body: { prompt: string }) {
    return this.prisma.session.create({
      data: {
        prompt: body.prompt, // ✅ required for Session
      },
    });
  }

  // Seed a test session + run (useful for testing DB)
  @Post('seed')
  async seed() {
    const prompt = 'Hello world (seeded)';
    return this.prisma.session.create({
      data: {
        prompt, // ✅ required
        runs: {
          create: [
            {
              model: 'gpt-4o',
              prompt, // ✅ required for ModelRun
              output: 'This is a seeded run output.',
              tokens: 42,
              cost: 0.001,
            },
          ],
        },
      },
      include: { runs: true },
    });
  }

  // Get all sessions + runs
  @Get()
  async all() {
    return this.prisma.session.findMany({
      include: { runs: true },
    });
  }
}
