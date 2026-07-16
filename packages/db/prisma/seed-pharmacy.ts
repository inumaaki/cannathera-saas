/* Dev seed for the Pharmacy Portal: pharmacy org + pharmacist account,
   patients assigned to it (with tiers + review cycles), inventory, pricing.
   Run: pnpm exec tsx prisma/seed-pharmacy.ts */
import {
  OrgType,
  PrismaClient,
  RedFlagSeverity,
  Role,
  SubscriptionTier,
} from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();
const DAY = 86_400_000;

const ITEMS = [
  { sku: "CAN-OIL-020-FS", name: "Thera-Cann 20:1 Full Spectrum", category: "Oil", thc: 20, cbd: 1, stockLevel: 2, unit: "ml", safetyThreshold: 50 },
  { sku: "CAN-FLW-MBK-01", name: "Midnight Blue Kush", category: "Flower", thc: 18.5, cbd: 0, stockLevel: 1240, unit: "g", safetyThreshold: 300 },
  { sku: "CAN-FLW-HMY-10", name: "Balanced Harmony 10:10", category: "Flower", thc: 10, cbd: 10, stockLevel: 45, unit: "g", safetyThreshold: 200 },
  { sku: "CAN-FLW-BDR-22", name: "Bedrocan 22/1", category: "Flower", thc: 22, cbd: 1, stockLevel: 860, unit: "g", safetyThreshold: 250 },
  { sku: "CAN-EXT-RSO-05", name: "RSO Vollextrakt 5 g", category: "Extract", thc: 60, cbd: 2, stockLevel: 18, unit: "Stk.", safetyThreshold: 10 },
];

const PATIENTS = [
  // `crisisDays`: days ago on which the entry breaches a clinical threshold
  // (pain >= 9 or sleep <= 2), so the red-flag engine + the "flagged" filter
  // have genuine data to show instead of an always-empty list.
  { first: "Julianne", last: "Schmidt", condition: "Chronische Schmerzen", tier: SubscriptionTier.PREMIUM, lastReviewDaysAgo: 34, crisisDays: [4, 11] },
  { first: "Robert", last: "Müller", condition: "Schlafstörungen", tier: SubscriptionTier.BASIC, lastReviewDaysAgo: 26, crisisDays: [2] },
  { first: "Elena", last: "Rodriguez", condition: "Neuropathischer Schmerz", tier: SubscriptionTier.PLUS, lastReviewDaysAgo: 12, crisisDays: [] },
  { first: "William", last: "Sterling", condition: "Spastik", tier: SubscriptionTier.PREMIUM, lastReviewDaysAgo: 3, crisisDays: [] },
];

async function main() {
  // The practice these patients are treated by. A patient has BOTH a practice
  // (doctor) and a pharmacy — the two portals must show the same people.
  const practice = await prisma.organization.findFirst({
    where: { type: OrgType.PRACTICE, name: "Praxis Dr. Weber" },
  });

  // --- Pharmacy org + pharmacist -------------------------------------------
  let org = await prisma.organization.findFirst({
    where: { name: "Adler-Apotheke Berlin", type: OrgType.PHARMACY },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Adler-Apotheke Berlin",
        type: OrgType.PHARMACY,
        branding: { contactPerson: "Dr. Elena Vance", address: "Kurfürstendamm 112, 10711 Berlin" },
      },
    });
  }

  const email = "apotheke@example.com";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash("testpass123"),
        role: Role.PHARMACY,
        firstName: "Elena",
        lastName: "Vance",
        memberships: {
          create: {
            orgId: org.id,
            roleInOrg: Role.PHARMACY,
            orgRole: "ADMIN",
            permissions: [
              "patients:view", "patients:create", "patients:note",
              "alerts:view", "alerts:acknowledge", "appointments:manage",
              "reports:view", "settings:practice", "settings:team", "compliance:view",
            ],
          },
        },
      },
    });
  }

  // --- Pricing plan + subscription (client's tier model) --------------------
  let plan = await prisma.pricingPlan.findFirst({ where: { tier: SubscriptionTier.PREMIUM } });
  if (!plan) {
    plan = await prisma.pricingPlan.create({
      data: {
        tier: SubscriptionTier.PREMIUM,
        name: "Premium",
        monthlyPrice: 349,
        reviewCap: 350,
        features: { pdfExports: true, prioritySupport: true, verlaufsanalysen: true },
      },
    });
  }
  const sub = await prisma.subscription.findFirst({ where: { orgId: org.id, isActive: true } });
  if (!sub) {
    await prisma.subscription.create({
      data: { orgId: org.id, planId: plan.id, isActive: true },
    });
  }

  // --- Inventory ------------------------------------------------------------
  for (const item of ITEMS) {
    await prisma.inventoryItem.upsert({
      where: { orgId_sku: { orgId: org.id, sku: item.sku } },
      update: { stockLevel: item.stockLevel },
      create: { ...item, orgId: org.id },
    });
  }

  // --- Patients assigned to the pharmacy ------------------------------------
  for (const p of PATIENTS) {
    const pEmail = `${p.first.toLowerCase()}.${p.last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`;
    let pUser = await prisma.user.findUnique({
      where: { email: pEmail },
      include: { patientProfile: true },
    });
    if (!pUser) {
      pUser = await prisma.user.create({
        data: {
          email: pEmail,
          passwordHash: await argon2.hash("testpass123"),
          role: Role.PATIENT,
          firstName: p.first,
          lastName: p.last,
          patientProfile: {
            create: {
              orgId: practice?.id ?? null, // treating practice
              pharmacyId: org.id, // dispensing pharmacy
              therapyStart: new Date(Date.now() - (40 + p.lastReviewDaysAgo) * DAY),
              patientRef: `CT-${Math.floor(1000 + Math.random() * 8999)}-PH`,
              packageTier: p.tier,
              condition: p.condition,
              lastReviewAt: new Date(Date.now() - p.lastReviewDaysAgo * DAY),
            },
          },
        },
        include: { patientProfile: true },
      });
    } else {
      await prisma.patientProfile.update({
        where: { userId: pUser.id },
        data: {
          orgId: pUser.patientProfile?.orgId ?? practice?.id ?? null,
          pharmacyId: org.id,
          packageTier: p.tier,
          condition: p.condition,
          lastReviewAt: new Date(Date.now() - p.lastReviewDaysAgo * DAY),
        },
      });
    }

    const profileId = (await prisma.patientProfile.findUniqueOrThrow({
      where: { userId: pUser.id },
    })).id;

    // Therapy logs so charts/adherence are real.
    const existing = await prisma.therapyLog.count({ where: { patientId: profileId } });
    if (existing === 0) {
      const logs = [];
      for (let d = 29; d >= 0; d--) {
        if (d % 7 === 3) continue; // occasional missed day
        const t = (29 - d) / 29;
        const crisis = p.crisisDays.includes(d);
        logs.push({
          patientId: profileId,
          loggedAt: new Date(Date.now() - d * DAY + 9 * 3_600_000),
          dosageG: Math.round((0.35 + 0.3 * t) * 20) / 20,
          strain: ITEMS[(d % 3) + 1].name,
          metrics: crisis
            ? { pain: 9.5, sleep: 2, activity: 1.5, qol: 2 } // breaches both thresholds
            : {
                pain: Math.max(0, Math.round((8 - 4 * t + (Math.random() - 0.5)) * 10) / 10),
                sleep: Math.min(10, Math.round((4 + 3 * t + (Math.random() - 0.5)) * 10) / 10),
                activity: Math.min(10, Math.round((3 + 3 * t) * 10) / 10),
                qol: Math.min(10, Math.round((4 + 2.8 * t) * 10) / 10),
              },
        });
      }
      await prisma.therapyLog.createMany({ data: logs });

      // The engine writes these when a patient logs live; seeded history needs them
      // explicitly, or the doctor's alert inbox would be empty for these patients.
      if (p.crisisDays.length > 0) {
        await prisma.redFlagHit.createMany({
          data: p.crisisDays.map((d) => ({
            patientId: profileId,
            severity: RedFlagSeverity.CRITICAL,
            message:
              "Sehr starke Schmerzen im Tageseintrag (NRS ≥ 9) — ärztliche Prüfung erforderlich.",
            source: "daily_log",
            createdAt: new Date(Date.now() - d * DAY + 9 * 3_600_000),
          })),
        });
      }
    }
  }

  // Also attach the original test patient to this pharmacy so cross-links work.
  const testPatient = await prisma.user.findUnique({
    where: { email: "test.patient@example.com" },
    include: { patientProfile: true },
  });
  if (testPatient?.patientProfile) {
    await prisma.patientProfile.update({
      where: { id: testPatient.patientProfile.id },
      data: {
        // Keeps his practice (doctor dashboard) AND gains the pharmacy.
        orgId: testPatient.patientProfile.orgId ?? practice?.id ?? null,
        pharmacyId: org.id,
        condition: "Chronische Schmerzen",
        packageTier: SubscriptionTier.PLUS,
        lastReviewAt: new Date(Date.now() - 31 * DAY),
      },
    });
  }

  console.log(`Pharmacy seeded: ${org.name} · login apotheke@example.com / testpass123`);
  console.log(`  ${ITEMS.length} SKUs, ${PATIENTS.length + (testPatient ? 1 : 0)} patients`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
