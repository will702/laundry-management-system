import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';

describe('ReportsService — UTC date bounds', () => {
  let service: ReportsService;
  let prisma: {
    receipt: { findMany: jest.Mock; count: jest.Mock };
    scheduledReport: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      receipt: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      scheduledReport: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: StorageService,
          useValue: { save: jest.fn(), getStream: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('dayBounds: start is UTC midnight, end is UTC 23:59:59.999', async () => {
    await service.getDailySales('2025-06-15');
    const call = prisma.receipt.findMany.mock.calls[0][0];
    const { gte, lte } = call.where.createdAt;
    expect(gte.toISOString()).toBe('2025-06-15T00:00:00.000Z');
    expect(lte.toISOString()).toBe('2025-06-15T23:59:59.999Z');
  });

  it('monthBounds: spans full calendar month in UTC', async () => {
    await service.getMonthlySales(2025, 2);
    const call = prisma.receipt.findMany.mock.calls[0][0];
    const { gte, lte } = call.where.createdAt;
    expect(gte.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(lte.toISOString()).toBe('2025-02-28T23:59:59.999Z');
  });

  it('dayBounds: December 31 end-of-year boundary', async () => {
    await service.getDailySales('2025-12-31');
    const call = prisma.receipt.findMany.mock.calls[0][0];
    const { gte, lte } = call.where.createdAt;
    expect(gte.toISOString()).toBe('2025-12-31T00:00:00.000Z');
    expect(lte.toISOString()).toBe('2025-12-31T23:59:59.999Z');
  });

  it('monthBounds: handles 31-day month (January)', async () => {
    await service.getMonthlySales(2025, 1);
    const call = prisma.receipt.findMany.mock.calls[0][0];
    const { gte, lte } = call.where.createdAt;
    expect(gte.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(lte.toISOString()).toBe('2025-01-31T23:59:59.999Z');
  });
});
