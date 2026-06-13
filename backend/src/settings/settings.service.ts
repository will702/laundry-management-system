import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    // Upsert default settings if none exist
    return this.prisma.settings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(dto: UpdateSettingsDto) {
    // Ensure the singleton row exists before updating
    await this.get();

    return this.prisma.settings.update({
      where: { id: SINGLETON_ID },
      data: dto,
    });
  }
}
