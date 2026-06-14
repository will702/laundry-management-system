import {
  Controller, Get, Param, Query, Res, UseGuards, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  getDailySales(@Query('date') date?: string) {
    const dateStr = date ?? new Date().toISOString().split('T')[0];
    return this.reportsService.getDailySales(dateStr);
  }

  @Get('monthly-sales')
  getMonthlySales(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getUTCFullYear();
    const m = month ? parseInt(month, 10) : now.getUTCMonth() + 1;
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      throw new BadRequestException('Invalid year or month');
    }
    return this.reportsService.getMonthlySales(y, m);
  }

  // ── Scheduled reports ───────────────────────────────────────────────────

  /** GET /reports/scheduled — list saved scheduled reports (most recent first) */
  @Get('scheduled')
  listScheduled() {
    return this.reportsService.listScheduledReports();
  }

  /** GET /reports/scheduled/:id/download — stream the saved .xlsx file */
  @Get('scheduled/:id/download')
  async downloadScheduled(@Param('id') id: string, @Res() res: Response) {
    const { stream, filename } = await this.reportsService.getScheduledReportStream(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  // ── On-demand Excel export ───────────────────────────────────────────────

  @Get('excel-export')
  async excelExport(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('include_deleted') includeDeleted: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date and end_date are required');
    }

    const buffer = await this.reportsService.generateExcel(
      startDate,
      endDate,
      includeDeleted === 'true',
    );

    const filename = `Laporan_Laundry_${startDate}_to_${endDate}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }
}
