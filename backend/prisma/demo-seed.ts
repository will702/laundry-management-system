/**
 * Demo seed — full reset + portfolio-ready Indonesian laundry data.
 * Run via: npm run db:demo-seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PINS = {
  admin: '1234',
  siti: '5678',
  andi: '9012',
} as const;

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

function formatIDR(cents: number): string {
  return `Rp ${(cents / 100).toLocaleString('id-ID')}`;
}

function computeTotals(
  items: Array<{ quantity: number; pricePerItem: number }>,
  discountPercent: number,
) {
  const subtotalCents = items.reduce((s, i) => s + i.quantity * i.pricePerItem, 0);
  const discountAmountCents = Math.round(subtotalCents * discountPercent / 100);
  const totalAmountCents = subtotalCents - discountAmountCents;
  return { subtotalCents, totalAmountCents };
}

async function clearDemoData() {
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.packageService.deleteMany();
  await prisma.package.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.client.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.scheduledReport.deleteMany();
}

async function seedSettings() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {
      businessName: 'Mass Laundry',
      businessAddress: 'Jl. Melati No. 12, Kemang, Jakarta Selatan 12730',
      businessPhone: '021-7654321',
      businessEmail: 'hello@masslaundry.id',
      footerNotes:
        'Terima kasih atas kepercayaan Anda\nJam operasional: 07:00–21:00 WIB\nKomplain maks 1×24 jam setelah pengambilan\nIkuti kami @masslaundry.id',
    },
    create: {
      id: 'singleton',
      businessName: 'Mass Laundry',
      businessAddress: 'Jl. Melati No. 12, Kemang, Jakarta Selatan 12730',
      businessPhone: '021-7654321',
      businessEmail: 'hello@masslaundry.id',
      footerNotes:
        'Terima kasih atas kepercayaan Anda\nJam operasional: 07:00–21:00 WIB\nKomplain maks 1×24 jam setelah pengambilan\nIkuti kami @masslaundry.id',
    },
  });
}

async function seedEmployees() {
  const hash = async (pin: string) => bcrypt.hash(pin, 12);

  const admin = await prisma.employee.create({
    data: {
      name: 'Budi Admin',
      pin: await hash(DEMO_PINS.admin),
      role: 'admin',
      phone: '081234567890',
    },
  });

  const siti = await prisma.employee.create({
    data: {
      name: 'Siti',
      pin: await hash(DEMO_PINS.siti),
      role: 'employee',
      phone: '081298765432',
    },
  });

  const andi = await prisma.employee.create({
    data: {
      name: 'Andi',
      pin: await hash(DEMO_PINS.andi),
      role: 'employee',
      phone: '081355512345',
    },
  });

  return { admin, siti, andi };
}

async function seedCatalog() {
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Cuci' } }),
    prisma.category.create({ data: { name: 'Setrika' } }),
    prisma.category.create({ data: { name: 'Dry Clean' } }),
    prisma.category.create({ data: { name: 'Sepatu' } }),
  ]);

  const units = await Promise.all([
    prisma.unit.create({ data: { name: 'kg' } }),
    prisma.unit.create({ data: { name: 'pcs' } }),
    prisma.unit.create({ data: { name: 'pasang' } }),
  ]);

  const [cuci, setrika, dryClean, sepatu] = categories;
  const [kg, pcs, pasang] = units;

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Cuci Kiloan',
        categoryId: cuci.id,
        unitId: kg.id,
        basePriceCents: 8000_00,
        durationDays: 2,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cuci Express',
        categoryId: cuci.id,
        unitId: kg.id,
        basePriceCents: 12_000_00,
        durationHours: 6,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Setrika Kiloan',
        categoryId: setrika.id,
        unitId: kg.id,
        basePriceCents: 6_000_00,
        durationDays: 1,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Setrika Satuan',
        categoryId: setrika.id,
        unitId: pcs.id,
        basePriceCents: 8_000_00,
        durationHours: 4,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Dry Clean Jas',
        categoryId: dryClean.id,
        unitId: pcs.id,
        basePriceCents: 45_000_00,
        durationDays: 3,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Dry Clean Gaun',
        categoryId: dryClean.id,
        unitId: pcs.id,
        basePriceCents: 55_000_00,
        durationDays: 3,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cuci Sepatu',
        categoryId: sepatu.id,
        unitId: pasang.id,
        basePriceCents: 35_000_00,
        durationDays: 2,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cuci Bed Cover',
        categoryId: cuci.id,
        unitId: pcs.id,
        basePriceCents: 25_000_00,
        durationDays: 2,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cuci Karpet',
        categoryId: cuci.id,
        unitId: pcs.id,
        basePriceCents: 40_000_00,
        durationDays: 3,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Cuci Boneka',
        categoryId: cuci.id,
        unitId: pcs.id,
        basePriceCents: 30_000_00,
        durationDays: 2,
      },
    }),
  ]);

  const [cuciKiloan, cuciExpress, setrikaKiloan, setrikaSatuan] = services;

  const paketHemat = await prisma.package.create({
    data: {
      name: 'Paket Hemat',
      description: 'Cuci + setrika kiloan',
      totalPriceCents: 140_000_00,
      discountedPriceCents: 120_000_00,
      packageServices: {
        create: [
          { serviceId: cuciKiloan.id },
          { serviceId: setrikaKiloan.id },
        ],
      },
    },
  });

  const paketExpress = await prisma.package.create({
    data: {
      name: 'Paket Express',
      description: 'Cuci express + setrika satuan',
      totalPriceCents: 200_000_00,
      discountedPriceCents: 175_000_00,
      packageServices: {
        create: [
          { serviceId: cuciExpress.id },
          { serviceId: setrikaSatuan.id },
        ],
      },
    },
  });

  return { services, packages: [paketHemat, paketExpress] };
}

async function seedClients() {
  const names = [
    { name: 'Rina Wijaya', phone: '081211122233' },
    { name: 'Ahmad Fauzi', phone: '081322233344' },
    { name: 'Dewi Lestari', phone: '081433344455' },
    { name: 'Bambang Sutrisno', phone: '081544455566' },
    { name: 'Maya Sari', phone: '081655566677' },
    { name: 'Hendra Gunawan', phone: '081766677788' },
    { name: 'Putri Anggraini', phone: '081877788899' },
    { name: 'Joko Santoso', phone: '081988899900' },
    { name: 'Lisa Permata', phone: '082199900011' },
    { name: 'Agus Prasetyo', phone: '082211100022' },
    { name: 'Sari Indah', phone: '082322211133' },
    { name: 'Doni Kurniawan', phone: '082433322244' },
    { name: 'Wulan Dari', phone: '082544433355' },
  ];

  return Promise.all(
    names.map((c) => prisma.client.create({ data: c })),
  );
}

type EmployeeRef = { id: string; name: string };
type ServiceRef = { id: string; name: string; basePriceCents: number };
type ClientRef = { id: string; name: string };

function pickStatus(index: number, isDeleted: boolean): string {
  if (isDeleted) return 'deleted';
  const r = index % 20;
  if (r < 14) return 'completed';
  if (r < 17) return 'ready';
  return 'pending';
}

function receiptsPerDay(dayOffset: number): number {
  const d = daysAgo(dayOffset);
  const dow = d.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  return isWeekend ? 4 + (dayOffset % 3) : 2 + (dayOffset % 2);
}

async function seedReceipts(
  employees: { admin: EmployeeRef; siti: EmployeeRef; andi: EmployeeRef },
  services: ServiceRef[],
  clients: ClientRef[],
) {
  const employeeList = [employees.siti, employees.andi, employees.admin];
  const deleteReasons = [
    'Salah input jumlah',
    'Pelanggan batal',
    'Duplikat bon',
    'Kesalahan layanan',
    'Test input',
  ];

  let receiptIndex = 0;
  const toCreate: Array<{
    dayOffset: number;
    hour: number;
    isDeleted: boolean;
  }> = [];

  for (let day = 29; day >= 0; day--) {
    const count = receiptsPerDay(day);
    for (let i = 0; i < count; i++) {
      const isDeleted = receiptIndex < 5;
      toCreate.push({
        dayOffset: day,
        hour: 8 + (i * 2) % 12,
        isDeleted,
      });
      receiptIndex++;
    }
  }

  let idx = 0;
  for (const spec of toCreate) {
    const client = clients[idx % clients.length];
    const employee = employeeList[idx % employeeList.length];
    const serviceCount = 1 + (idx % 3);
    const discountPercent = idx % 7 === 0 ? 10 : idx % 11 === 0 ? 5 : 0;

    const selectedServices: ServiceRef[] = [];
    for (let s = 0; s < serviceCount; s++) {
      selectedServices.push(services[(idx + s) % services.length]);
    }

    const items = selectedServices.map((svc) => {
      const quantity = svc.name.includes('Kiloan') ? 2 + (idx % 4) : 1 + (idx % 2);
      const pricePerItem = svc.basePriceCents;
      const lineTotal = pricePerItem * quantity;
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        quantity,
        pricePerItem,
        lineTotal,
      };
    });

    const { subtotalCents, totalAmountCents } = computeTotals(items, discountPercent);
    const status = pickStatus(idx, spec.isDeleted);
    const createdAt = daysAgo(spec.dayOffset, spec.hour);

    const receipt = await prisma.receipt.create({
      data: {
        clientId: client.id,
        employeeId: employee.id,
        clientName: client.name,
        employeeName: employee.name,
        subtotalCents,
        discountPercent,
        totalAmountCents,
        status: spec.isDeleted ? 'completed' : status,
        notes: idx % 5 === 0 ? 'Ambil sore hari' : undefined,
        isDeleted: spec.isDeleted,
        deletedAt: spec.isDeleted ? daysAgo(spec.dayOffset - 1, 14) : undefined,
        deletedById: spec.isDeleted ? employees.admin.id : undefined,
        deleteReason: spec.isDeleted ? deleteReasons[idx % deleteReasons.length] : undefined,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
      },
    });

    if (idx % 20 === 0) {
      console.log(`  … ${idx + 1} receipts (${formatIDR(totalAmountCents)})`);
    }
    idx++;
  }
}

async function main() {
  console.log('Resetting demo data…');
  await clearDemoData();

  console.log('Seeding settings…');
  await seedSettings();

  console.log('Seeding employees…');
  const employees = await seedEmployees();
  console.log(`  ✓ Admin PIN: ${DEMO_PINS.admin} | Siti: ${DEMO_PINS.siti} | Andi: ${DEMO_PINS.andi}`);

  console.log('Seeding catalog…');
  const { services } = await seedCatalog();
  console.log(`  ✓ ${services.length} services`);

  console.log('Seeding clients…');
  const clients = await seedClients();
  console.log(`  ✓ ${clients.length} clients`);

  console.log('Seeding receipts (last 30 days)…');
  await seedReceipts(employees, services, clients);

  const counts = await prisma.receipt.groupBy({
    by: ['status'],
    where: { isDeleted: false },
    _count: true,
  });
  const deleted = await prisma.receipt.count({ where: { isDeleted: true } });

  console.log('\n✓ Demo seed complete');
  console.log(`  Active receipts by status: ${counts.map((c) => `${c.status}=${c._count}`).join(', ')}`);
  console.log(`  Soft-deleted receipts: ${deleted}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
