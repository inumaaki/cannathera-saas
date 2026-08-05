import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const shouldReset = process.env.ADMIN_RESET_PASSWORD === "true";
  const passwordHash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.ADMIN,
      isActive: true,
      ...(shouldReset ? { passwordHash } : {}),
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

  console.log(
    existing
      ? `Admin access confirmed for ${admin.email}${shouldReset ? "; password reset" : ""}`
      : `Admin user created: ${admin.email}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
