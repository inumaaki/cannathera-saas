import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting all user passwords...');
  const passwordHash = await argon2.hash('DemoPassword123!');
  const result = await prisma.user.updateMany({
    data: {
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      temporaryPasswordEncrypted: null,
    },
  });
  console.log(`Successfully reset passwords for ${result.count} users to "DemoPassword123!"`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
