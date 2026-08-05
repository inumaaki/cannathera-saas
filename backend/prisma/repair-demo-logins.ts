import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const DEMO_EMAILS = [
  'hsnxinu@gmail.com',
  'evilurl117@gmail.com',
  'pathtoprogress0@gmail.com',
];

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_REPAIR !== 'true') {
    throw new Error('Set ALLOW_DEMO_REPAIR=true explicitly to repair demo users in production');
  }

  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('DEMO_ACCOUNT_PASSWORD is required and must contain at least 12 characters');
  }

  const passwordHash = await argon2.hash(password);
  for (const email of DEMO_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, patientProfile: { select: { id: true } } },
    });
    if (!user) {
      console.warn(`Missing demo user: ${email}`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        temporaryPasswordEncrypted: null,
      },
    });
    if (user.patientProfile) {
      await prisma.patientProfile.update({
        where: { id: user.patientProfile.id },
        data: { hasActiveSubscription: true },
      });
    }
    console.log(`Repaired demo login: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
