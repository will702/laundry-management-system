import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptStatusDto } from './dto/update-receipt-status.dto';
import { DeleteReceiptDto } from './dto/delete-receipt.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  create(@Body() dto: CreateReceiptDto, @CurrentUser() user: { id: string }) {
    return this.receiptsService.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.receiptsService.findAll({
      limit: limit ? parseInt(limit, 10) : undefined,
      employeeId,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get('audit/by-employee')
  @UseGuards(RolesGuard) @Roles('admin')
  getReceiptsByEmployee() {
    return this.receiptsService.getReceiptsByEmployee();
  }

  @Get('audit/deleted')
  @UseGuards(RolesGuard) @Roles('admin')
  getDeletedReceipts() {
    return this.receiptsService.getDeletedReceipts();
  }

  @Get('audit/daily-summary')
  @UseGuards(RolesGuard) @Roles('admin')
  getDailySummary(@Query('date') date?: string) {
    return this.receiptsService.getDailySummary(date);
  }

  @Get('audit/employee-activity/:employeeId')
  @UseGuards(RolesGuard) @Roles('admin')
  getEmployeeActivity(@Param('employeeId') employeeId: string) {
    return this.receiptsService.getEmployeeActivity(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.receiptsService.findOne(id);
  }

  @Get(':id/print')
  getPrintPayload(@Param('id') id: string) {
    return this.receiptsService.getPrintPayload(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateReceiptStatusDto) {
    return this.receiptsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  softDelete(
    @Param('id') id: string,
    @Body() dto: DeleteReceiptDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.receiptsService.softDelete(id, dto, user.id);
  }
}
