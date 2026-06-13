import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { UpdateReceiptStatusDto } from './dto/update-receipt-status.dto';
import { DeleteReceiptDto } from './dto/delete-receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReceiptDto, employeeId: string) {
    // Look up employee name
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // Resolve client name — either from DB (if clientId given) or use provided clientName
    let resolvedClientName = dto.clientName;
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!client) throw new NotFoundException(`Client ${dto.clientId} not found`);
      resolvedClientName = client.name;
    }

    // Server-side total recomputation — IGNORE any client-supplied totals
    let subtotalCents = 0;
    const resolvedItems: Array<{
      serviceId?: string;
      serviceName: string;
      itemType?: string;
      quantity: number;
      pricePerItem: number;
      lineTotal: number;
    }> = [];

    for (const item of dto.items) {
      let pricePerItem = 0;
      let serviceName = item.serviceName;

      if (item.serviceId) {
        const service = await this.prisma.service.findUnique({
          where: { id: item.serviceId },
          select: { id: true, name: true, basePriceCents: true, isActive: true },
        });
        if (!service || !service.isActive) {
          throw new UnprocessableEntityException(`Service ${item.serviceId} not found or inactive`);
        }
        pricePerItem = service.basePriceCents;
        serviceName = service.name; // canonical name from DB
      }
      // If no serviceId (walk-in custom item), pricePerItem stays 0 — acceptable for notes-only items

      const lineTotal = pricePerItem * item.quantity;
      subtotalCents += lineTotal;
      resolvedItems.push({
        serviceId: item.serviceId,
        serviceName,
        itemType: item.itemType,
        quantity: item.quantity,
        pricePerItem,
        lineTotal,
      });
    }

    // Validate discount
    if (dto.discountPercent < 0 || dto.discountPercent > 100) {
      throw new BadRequestException('discountPercent must be 0–100');
    }
    const discountAmountCents = Math.round(subtotalCents * dto.discountPercent / 100);
    const totalAmountCents = subtotalCents - discountAmountCents;

    const receipt = await this.prisma.receipt.create({
      data: {
        clientId: dto.clientId,
        employeeId,
        clientName: resolvedClientName,
        employeeName: employee.name,
        subtotalCents,
        discountPercent: dto.discountPercent,
        totalAmountCents,
        notes: dto.notes,
        items: {
          create: resolvedItems,
        },
      },
      include: { items: true },
    });

    return receipt;
  }

  async findAll(options: { limit?: number; employeeId?: string; includeDeleted?: boolean } = {}) {
    const { limit = 100, employeeId, includeDeleted = false } = options;
    return this.prisma.receipt.findMany({
      where: {
        ...(employeeId ? { employeeId } : {}),
        ...(!includeDeleted ? { isDeleted: false } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findOne(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!receipt || receipt.isDeleted) {
      throw new NotFoundException(`Receipt ${id} not found`);
    }
    return receipt;
  }

  async updateStatus(id: string, dto: UpdateReceiptStatusDto) {
    const receipt = await this.prisma.receipt.findUnique({ where: { id } });
    if (!receipt || receipt.isDeleted) throw new NotFoundException(`Receipt ${id} not found`);

    return this.prisma.receipt.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async softDelete(id: string, dto: DeleteReceiptDto, deletedById: string) {
    const receipt = await this.prisma.receipt.findUnique({ where: { id } });
    if (!receipt || receipt.isDeleted) throw new NotFoundException(`Receipt ${id} not found`);

    return this.prisma.receipt.update({
      where: { id },
      data: {
        isDeleted: true,
        status: 'deleted',
        deletedAt: new Date(),
        deletedById,
        deleteReason: dto.reason,
      },
      include: { items: true },
    });
  }

  async getPrintPayload(id: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!receipt) throw new NotFoundException(`Receipt ${id} not found`);

    const settings = await this.prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });

    return {
      // Business info
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessPhone: settings.businessPhone,
      footerNotes: settings.footerNotes,
      // Receipt data
      ...receipt,
      // Timestamp
      printTimestamp: new Date().toISOString(),
    };
  }

  // ── Audit endpoints ────────────────────────────────────────────────────────

  async getReceiptsByEmployee() {
    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const results = await Promise.all(
      employees.map(async (emp) => {
        const receipts = await this.prisma.receipt.findMany({
          where: { employeeId: emp.id, isDeleted: false },
          select: { totalAmountCents: true, createdAt: true },
        });
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          receiptCount: receipts.length,
          totalRevenueCents: receipts.reduce((s, r) => s + r.totalAmountCents, 0),
        };
      }),
    );

    return results.sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);
  }

  async getDeletedReceipts() {
    return this.prisma.receipt.findMany({
      where: { isDeleted: true },
      include: { items: true },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async getEmployeeActivity(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);

    const receipts = await this.prisma.receipt.findMany({
      where: { employeeId, isDeleted: false },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return { employee, receipts };
  }

  async getDailySummary(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    // UTC bounds for the day
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

    const receipts = await this.prisma.receipt.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: start, lte: end },
      },
      include: { items: true },
    });

    return {
      date: start.toISOString().split('T')[0],
      receiptCount: receipts.length,
      totalRevenueCents: receipts.reduce((s, r) => s + r.totalAmountCents, 0),
      receipts,
    };
  }
}
