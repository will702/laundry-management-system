import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Upsert singleton Settings
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      businessName: 'Mass Laundry',
      footerNotes: 'Terima kasih atas kepercayaan Anda\nJam operasional: 07:00-21:00\nKomplain maks 1x24 jam',
    },
  });
  console.log('✓ Settings seeded');

  // Seed a bootstrap admin if ADMIN_REGISTRATION_CODE is set in env
  // and no admin exists yet
  const adminCode = process.env.ADMIN_REGISTRATION_CODE;
  const bootstrapPin = process.env.BOOTSTRAP_ADMIN_PIN;
  const bootstrapName = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin';

  if (adminCode && bootstrapPin) {
    const existingAdmin = await prisma.employee.findFirst({
      where: { role: 'admin' },
    });
    if (!existingAdmin) {
      const hashedPin = await bcrypt.hash(bootstrapPin, 12);
      await prisma.employee.create({
        data: {
          name: bootstrapName,
          pin: hashedPin,
          role: 'admin',
        },
      });
      console.log(`✓ Bootstrap admin "${bootstrapName}" created`);
    } else {
      console.log('✓ Admin already exists, skipping bootstrap');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
