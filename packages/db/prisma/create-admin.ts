import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@cannathera.de";
  const passwordHash = await argon2.hash("ct-admin-2026-secure!");

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      firstName: "System",
      lastName: "Administrator",
      isActive: true,
    },
  });

  console.log(`Admin user created: ${admin.email} / ct-admin-2026-secure!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
