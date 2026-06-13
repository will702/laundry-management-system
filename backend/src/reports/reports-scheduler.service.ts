import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';

@Injectable()
export class ReportsSchedulerService {
  private readonly logger = new Logger(ReportsSchedulerService.name);

  constructor(private readonly reportsService: ReportsService) {}

  /** Daily report: runs at 23:55 WIB every day (16:55 UTC) */
  @Cron('55 16 * * *', { timeZone: 'Asia/Jakarta' })
  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    this.logger.log(`Generating daily report for ${today}`);
    try {
      await this.reportsService.generateAndSaveReport('daily', today, today);
      this.logger.log(`Daily report for ${today} saved`);
    } catch (err) {
      this.logger.error(`Failed to generate daily report: ${err}`);
    }
  }

  /** Weekly report: runs every Sunday at 23:55 WIB (16:55 UTC) */
  @Cron('55 16 * * 0', { timeZone: 'Asia/Jakarta' })
  async generateWeeklyReport() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    this.logger.log(`Generating weekly report ${startStr} to ${endStr}`);
    try {
      await this.reportsService.generateAndSaveReport('weekly', startStr, endStr);
      this.logger.log(`Weekly report saved`);
    } catch (err) {
      this.logger.error(`Failed to generate weekly report: ${err}`);
    }
  }

  /** Monthly report: runs on 1st of each month at 00:05 WIB (17:05 UTC prev day) */
  @Cron('5 17 1 * *', { timeZone: 'Asia/Jakarta' })
  async generateMonthlyReport() {
    const now = new Date();
    // We are on the 1st, so "last month" is month - 1
    const year = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const month = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    this.logger.log(`Generating monthly report ${startStr} to ${endStr}`);
    try {
      await this.reportsService.generateAndSaveReport('monthly', startStr, endStr);
      this.logger.log(`Monthly report saved`);
    } catch (err) {
      this.logger.error(`Failed to generate monthly report: ${err}`);
    }
  }
}
