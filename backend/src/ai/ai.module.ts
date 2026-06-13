import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ReportsModule } from '../reports/reports.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ReportsModule, PrismaModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
