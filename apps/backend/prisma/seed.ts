import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const passwordHash = await hash('Password@123', 12);

  await prisma.user.upsert({
    where: { email: 'demo@interviewcoach.dev' },
    update: {
      fullName: 'Demo User',
      passwordHash,
    },
    create: {
      email: 'demo@interviewcoach.dev',
      fullName: 'Demo User',
      passwordHash,
    },
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
