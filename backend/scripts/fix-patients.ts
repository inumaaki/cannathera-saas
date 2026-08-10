import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting patient profile repair script...');

  // 1. Find all users who are PATIENTs
  const patientUsers = await prisma.user.findMany({
    where: { role: Role.PATIENT },
    include: {
      patientProfile: true,
      memberships: true,
    },
  });

  console.log(`Found ${patientUsers.length} total PATIENT users.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of patientUsers) {
    if (!user.patientProfile) {
      console.log(`User ${user.email} is missing a PatientProfile. Creating one...`);
      // Get orgId from their membership if it exists
      const orgId = user.memberships[0]?.orgId || null;
      
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          orgId: orgId,
          packageTier: 'BASIC', // Default fallback
          hasActiveSubscription: true,
          onboardingCompleted: false,
        },
      });
      createdCount++;
    } else if (!user.patientProfile.hasActiveSubscription) {
      console.log(`User ${user.email} has a profile but lacks an active subscription. Updating...`);
      await prisma.patientProfile.update({
        where: { id: user.patientProfile.id },
        data: {
          hasActiveSubscription: true,
        },
      });
      updatedCount++;
    }
  }

  console.log('--- Summary ---');
  console.log(`Created new profiles: ${createdCount}`);
  console.log(`Updated subscriptions: ${updatedCount}`);
  console.log('Repair complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
