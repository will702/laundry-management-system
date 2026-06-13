import type { Tool } from '@anthropic-ai/sdk/resources/messages/messages';
import { PrismaService } from '../prisma/prisma.service';

// Tool definitions for Claude
export const CHAT_TOOLS: Tool[] = [
  {
    name: 'get_sales_summary',
    description: 'Get total revenue and receipt count for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_top_services',
    description: 'Get the top N most-ordered services by quantity in a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
        limit: { type: 'number', description: 'Max results (1-20)', default: 5 },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_revenue_by_employee',
    description: 'Get total revenue and receipt count per employee for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_customer_summary',
    description: 'Get top customers by total spending (all time or in a date range).',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max results (1-20)', default: 5 },
        start_date: { type: 'string', description: 'Optional start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'Optional end date YYYY-MM-DD' },
      },
      required: [],
    },
  },
  {
    name: 'get_receipt_count_by_status',
    description: 'Count receipts grouped by status (pending, ready, completed) for a date range.',
    input_schema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date YYYY-MM-DD' },
        end_date: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['start_date', 'end_date'],
    },
  },
];

// Bounded date helper
function dateRange(startStr: string, endStr: string) {
  return {
    gte: new Date(startStr + 'T00:00:00Z'),
    lte: new Date(endStr + 'T23:59:59Z'),
  };
}

function clampLimit(limit: unknown): number {
  const n = typeof limit === 'number' ? limit : 5;
  return Math.min(Math.max(1, n), 20);
}

// Tool executor: maps tool name + input → Prisma query result
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  prisma: PrismaService,
): Promise<unknown> {
  switch (name) {
    case 'get_sales_summary': {
      const range = dateRange(input.start_date as string, input.end_date as string);
      const receipts = await prisma.receipt.findMany({
        where: { isDeleted: false, createdAt: range },
        select: { totalAmountCents: true },
      });
      return {
        period: `${input.start_date} to ${input.end_date}`,
        receiptCount: receipts.length,
        totalRevenueCents: receipts.reduce((s, r) => s + r.totalAmountCents, 0),
      };
    }

    case 'get_top_services': {
      const range = dateRange(input.start_date as string, input.end_date as string);
      const items = await prisma.receiptItem.findMany({
        where: { receipt: { isDeleted: false, createdAt: range } },
        select: { serviceName: true, quantity: true, lineTotal: true },
      });
      const byService: Record<string, { serviceName: string; totalQty: number; totalRevenueCents: number }> = {};
      for (const item of items) {
        if (!byService[item.serviceName]) {
          byService[item.serviceName] = { serviceName: item.serviceName, totalQty: 0, totalRevenueCents: 0 };
        }
        byService[item.serviceName].totalQty += item.quantity;
        byService[item.serviceName].totalRevenueCents += item.lineTotal;
      }
      return Object.values(byService)
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, clampLimit(input.limit));
    }

    case 'get_revenue_by_employee': {
      const range = dateRange(input.start_date as string, input.end_date as string);
      const receipts = await prisma.receipt.findMany({
        where: { isDeleted: false, createdAt: range },
        select: { employeeName: true, totalAmountCents: true },
      });
      const byEmp: Record<string, { name: string; count: number; revenueCents: number }> = {};
      for (const r of receipts) {
        if (!byEmp[r.employeeName]) byEmp[r.employeeName] = { name: r.employeeName, count: 0, revenueCents: 0 };
        byEmp[r.employeeName].count += 1;
        byEmp[r.employeeName].revenueCents += r.totalAmountCents;
      }
      return Object.values(byEmp).sort((a, b) => b.revenueCents - a.revenueCents);
    }

    case 'get_customer_summary': {
      const where: Record<string, unknown> = { isDeleted: false };
      if (input.start_date && input.end_date) {
        where.createdAt = dateRange(input.start_date as string, input.end_date as string);
      }
      const receipts = await prisma.receipt.findMany({
        where,
        select: { clientName: true, totalAmountCents: true },
      });
      const byClient: Record<string, { name: string; count: number; totalSpentCents: number }> = {};
      for (const r of receipts) {
        if (!byClient[r.clientName]) byClient[r.clientName] = { name: r.clientName, count: 0, totalSpentCents: 0 };
        byClient[r.clientName].count += 1;
        byClient[r.clientName].totalSpentCents += r.totalAmountCents;
      }
      return Object.values(byClient)
        .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
        .slice(0, clampLimit(input.limit));
    }

    case 'get_receipt_count_by_status': {
      const range = dateRange(input.start_date as string, input.end_date as string);
      const statuses = ['pending', 'ready', 'completed'];
      const counts = await Promise.all(
        statuses.map(async (status) => ({
          status,
          count: await prisma.receipt.count({ where: { status, isDeleted: false, createdAt: range } }),
        })),
      );
      return counts;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
