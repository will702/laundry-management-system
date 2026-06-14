import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsSchedulerService } from './reports-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), StorageModule],
  providers: [ReportsService, ReportsSchedulerService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
