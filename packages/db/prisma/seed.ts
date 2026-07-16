/* Dev seed: therapy history + appointments for the test patient.
   Run: pnpm --filter @cannathera/db seed */
import { PrismaClient, TeleProvider } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 86_400_000;
const STRAINS = ["Blue Dream (Hybrid)", "Bedrocan (Sativa)", "Pedanios 22/1"];

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "test.patient@example.com" },
    include: { patientProfile: true },
  });
  if (!user?.patientProfile) {
    console.log("No test patient found — register test.patient@example.com first.");
    return;
  }
  const patientId = user.patientProfile.id;

  // Therapy started 34 days ago (matches Figma "Day 34 of 90").
  const therapyStart = new Date(Date.now() - 33 * DAY);
  await prisma.patientProfile.update({
    where: { id: patientId },
    data: { therapyStart, patientRef: "CT-8829-XPL" },
  });

  await prisma.therapyLog.deleteMany({ where: { patientId } });

  // 34 days of logs, one gap day per week (adherence ~96%), improving trend.
  const logs = [];
  for (let d = 0; d < 34; d++) {
    if (d % 9 === 5) continue; // occasional missed day
    const t = d / 33; // 0..1 progress
    const wobble = () => (Math.random() - 0.5) * 0.8;
    logs.push({
      patientId,
      loggedAt: new Date(therapyStart.getTime() + d * DAY + 9 * 3_600_000),
      dosageG: Math.round((0.3 + 0.25 * t) * 20) / 20,
      strain: STRAINS[Math.floor(d / 14) % STRAINS.length],
      metrics: {
        pain: Math.max(0, Math.round((8 - 4.5 * t + wobble()) * 10) / 10),
        sleep: Math.min(10, Math.round((4 + 3.2 * t + wobble()) * 10) / 10),
        activity: Math.min(10, Math.round((3 + 3 * t + wobble()) * 10) / 10),
        qol: Math.min(10, Math.round((4 + 2.5 * t + wobble()) * 10) / 10),
      },
    });
  }
  await prisma.therapyLog.createMany({ data: logs });

  // Appointments: one imminent video consult + one later review + one past intake.
  await prisma.telemedicineSession.deleteMany({ where: { patientId } });
  await prisma.telemedicineSession.createMany({
    data: [
      {
        patientId,
        provider: TeleProvider.ZOOM,
        scheduledAt: new Date(Date.now() + 12 * 60_000),
        durationMin: 30,
        joinUrl: "https://zoom.example/join/dev-consult",
      },
      {
        patientId,
        provider: TeleProvider.ZOOM,
        scheduledAt: new Date(Date.now() + 14 * DAY),
        durationMin: 20,
      },
      {
        patientId,
        provider: TeleProvider.ZOOM,
        scheduledAt: new Date(therapyStart.getTime() - 2 * DAY),
        durationMin: 45,
      },
    ],
  });

  console.log(`Seeded ${logs.length} therapy logs + 3 appointments for ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
