import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      subscriptions: true,
      memberships: true,
    },
  });

  let updatedUsersCount = 0;

  for (const org of orgs) {
    const isSubscribed = org.subscriptions.some((s) => s.isActive);

    for (const membership of org.memberships) {
      const user = await prisma.user.findUnique({ where: { id: membership.userId } });
      if (user && user.isActive !== isSubscribed && user.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: { isActive: isSubscribed },
        });
        updatedUsersCount++;
      }
    }
  }

  console.log(`Sync complete! Synchronized ${updatedUsersCount} user accounts' active state with their respective organizations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
