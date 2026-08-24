import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create a Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@example.com' },
    update: { passwordHash, role: 'DOCTOR' },
    create: {
      email: 'doctor@example.com',
      passwordHash,
      role: 'DOCTOR',
      name: 'Dr. Gregory House',
      specialization: 'Diagnostic Medicine',
      slotDuration: 30,
      workingHours: { start: "09:00", end: "17:00" }
    }
  });

  // 2. Create an Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
      name: 'Super Admin'
    }
  });

  console.log('✅ Seeded Doctor:', doctor.email);
  console.log('✅ Seeded Admin:', admin.email);
  console.log('Password for both is: password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
