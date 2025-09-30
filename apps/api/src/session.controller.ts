import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll() {
    return this.prisma.session.findMany();
  }
}
