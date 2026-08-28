import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting admin password...');
  const passwordHash = await argon2.hash('ct-admin-2026-secure!');
  const result = await prisma.user.updateMany({
    where: { role: Role.ADMIN },
    data: {
      passwordHash,
      isActive: true,
      mustChangePassword: false,
    },
  });
  console.log(`Successfully reset passwords for ${result.count} ADMIN users to "ct-admin-2026-secure!"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
