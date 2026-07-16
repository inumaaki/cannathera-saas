/* Dev seed for the Enterprise Overview: an umbrella partner with the existing
   pharmacy + practice underneath it, so the network aggregates real data.
   Run: pnpm exec tsx prisma/seed-enterprise.ts */
import { OrgType, PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const name = "GreenPath Health Group";

  let org = await prisma.organization.findFirst({
    where: { name, type: OrgType.ENTERPRISE },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name,
        type: OrgType.ENTERPRISE,
        branding: {
          primaryColor: "#0B4D34",
          accentColor: "#F97316",
          contactPerson: "Markus Lehmann",
          address: "Friedrichstraße 68, 10117 Berlin",
        },
      },
    });
  }

  const email = "enterprise@example.com";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash("testpass123"),
        role: Role.ENTERPRISE,
        firstName: "Markus",
        lastName: "Lehmann",
        memberships: {
          create: {
            orgId: org.id,
            roleInOrg: Role.ENTERPRISE,
            // Enterprise org roles: SUPER_ADMIN | SUPPORT | BILLING | VIEWER
            orgRole: "SUPER_ADMIN",
            permissions: [
              "patients:view",
              "alerts:view",
              "reports:view",
              "settings:practice",
              "settings:team",
              "compliance:view",
            ],
          },
        },
      },
    });
  }

  // Attach the existing pharmacy + practice as network members.
  const members = await prisma.organization.findMany({
    where: {
      type: { in: [OrgType.PHARMACY, OrgType.PRACTICE] },
      name: { in: ["Adler-Apotheke Berlin", "Praxis Dr. Weber"] },
    },
  });
  for (const m of members) {
    await prisma.organization.update({
      where: { id: m.id },
      data: {
        parentOrgId: org.id,
        joinedAt: m.joinedAt ?? new Date(Date.now() - 120 * 86_400_000),
      },
    });
  }

  console.log(`Enterprise seeded: ${org.name} · login ${email} / testpass123`);
  console.log(`  network members: ${members.map((m) => m.name).join(", ") || "none"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
