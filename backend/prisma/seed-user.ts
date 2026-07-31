import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function main() {
  const email = 'd.larkin@cannathera-report.de';
  const passwordHash = '$2y$10$u0FzWjT1lYkP01XQzN4oA.vT0bY1V/l.8Y45T7f82.YJmN7u8F28O'; // dummy hash

  // Upsert the user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName: 'D.',
      lastName: 'Larkin',
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      firstName: 'D.',
      lastName: 'Larkin',
      role: 'PATIENT',
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // Upsert the patient profile
  await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {
      address: 'Hügelstr. 1, 46117 Oberhausen',
      phone: '015568425924',
      onboardingCompleted: true,
      hasActiveSubscription: true,
      packageTier: 'BASIC',
      mainComplaints: ['Chronic Pain', 'Insomnia'],
      complaintsDescription: 'Real user data injected for testing.',
      therapyGoals: ['Pain Management', 'Better Sleep'],
    },
    create: {
      userId: user.id,
      address: 'Hügelstr. 1, 46117 Oberhausen',
      phone: '015568425924',
      onboardingCompleted: true,
      hasActiveSubscription: true,
      packageTier: 'BASIC',
      mainComplaints: ['Chronic Pain', 'Insomnia'],
      complaintsDescription: 'Real user data injected for testing.',
      therapyGoals: ['Pain Management', 'Better Sleep'],
    },
  });

  console.log(`Successfully seeded user: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
