/**
 * Pilot access tool — unlock (or re-lock) accounts past the subscription paywall.
 *
 * The portal gates partners on an active `Subscription` row for their org, and
 * patients on `PatientProfile.hasActiveSubscription`. Demo/pilot accounts created
 * via the admin onboarding flow intentionally have neither, so they hit the
 * "Please activate your partner account" wall. This script grants that access
 * directly — no Stripe checkout, no plan selection — mirroring exactly what
 * StripeService.fulfillOrganizationCheckout / fulfillPatientCheckout do.
 *
 * Usage (from backend/):
 *   pnpm exec tsx prisma/activate-access.ts                 # unlock the default pilot list
 *   pnpm exec tsx prisma/activate-access.ts a@x.de b@y.de   # unlock specific emails
 *   pnpm exec tsx prisma/activate-access.ts --tier=ENTERPRISE a@x.de
 *   pnpm exec tsx prisma/activate-access.ts --off a@x.de    # revoke access again
 *
 * Idempotent and reversible. Safe to re-run.
 */
import { PrismaClient, SubscriptionTier } from "@prisma/client";

const prisma = new PrismaClient();

// Default pilot accounts — edit this list to add partners/GPs you want unlocked.
const DEFAULT_PILOTS = [
  "hsnxinu@gmail.com", // ENTERPRISE — Big Pharma Network
  "evilurl117@gmail.com", // PRACTICE — Dr. Smith Clinic
  "pathtoprogress0@gmail.com", // PATIENT — Alice Harry
];

function parseArgs(argv: string[]) {
  let off = false;
  let tier: SubscriptionTier | null = null;
  const emails: string[] = [];
  for (const a of argv) {
    if (a === "--off") off = true;
    else if (a.startsWith("--tier=")) {
      const t = a.slice(7).toUpperCase();
      if (!(t in SubscriptionTier)) {
        throw new Error(`Invalid tier "${t}". Use one of: ${Object.keys(SubscriptionTier).join(", ")}`);
      }
      tier = t as SubscriptionTier;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag "${a}"`);
    } else {
      emails.push(a.toLowerCase());
    }
  }
  return { off, tier, emails: emails.length ? emails : DEFAULT_PILOTS.map((e) => e.toLowerCase()) };
}

/** Ensure a PricingPlan row exists for `tier`, returning its id (subscriptions need a plan FK). */
async function ensurePlan(tier: SubscriptionTier): Promise<string> {
  const existing = await prisma.pricingPlan.findFirst({ where: { tier } });
  if (existing) return existing.id;
  const created = await prisma.pricingPlan.create({
    data: {
      tier,
      name: `${tier} (Pilot)`,
      monthlyPrice: 0,
      reviewCap: null,
      features: { pilot: true, pdfExports: true },
      isActive: true,
    },
  });
  console.log(`  · created missing PricingPlan for tier ${tier}`);
  return created.id;
}

async function unlockPartner(orgId: string, orgName: string, memberIds: string[], tier: SubscriptionTier | null, off: boolean) {
  if (off) {
    const subs = await prisma.subscription.updateMany({ where: { orgId }, data: { isActive: false } });
    await prisma.user.updateMany({ where: { id: { in: memberIds } }, data: { isActive: false } });
    console.log(`  · org "${orgName}" — deactivated ${subs.count} subscription(s), locked ${memberIds.length} member(s)`);
    return;
  }
  const existing = await prisma.subscription.findFirst({ where: { orgId } });
  if (existing) {
    const data: { isActive: boolean; planId?: string } = { isActive: true };
    if (tier) data.planId = await ensurePlan(tier);
    await prisma.subscription.update({ where: { id: existing.id }, data });
    console.log(`  · org "${orgName}" — reactivated existing subscription`);
  } else {
    const planId = await ensurePlan(tier ?? SubscriptionTier.PREMIUM);
    await prisma.subscription.create({ data: { orgId, planId, isActive: true } });
    console.log(`  · org "${orgName}" — created active subscription (${tier ?? "PREMIUM"})`);
  }
  const u = await prisma.user.updateMany({ where: { id: { in: memberIds } }, data: { isActive: true } });
  console.log(`  · org "${orgName}" — activated ${u.count} member account(s)`);
}

async function unlockPatient(userId: string, off: boolean) {
  await prisma.patientProfile.update({
    where: { userId },
    data: { hasActiveSubscription: !off },
  });
  console.log(`  · patient profile — hasActiveSubscription=${!off}`);
}

async function main() {
  const { off, tier, emails } = parseArgs(process.argv.slice(2));
  console.log(`${off ? "LOCKING" : "UNLOCKING"} ${emails.length} account(s)${tier ? ` (tier ${tier})` : ""}:\n`);

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: { select: { id: true } },
        memberships: { select: { orgId: true, org: { select: { name: true, memberships: { select: { userId: true } } } } } },
      },
    });

    if (!user) {
      console.log(`✗ ${email} — no such user (skipped)`);
      continue;
    }

    console.log(`${off ? "🔒" : "🔓"} ${email}  [${user.role}]`);
    const membership = user.memberships[0];

    if (membership) {
      const memberIds = membership.org.memberships.map((m) => m.userId);
      await unlockPartner(membership.orgId, membership.org.name, memberIds, tier, off);
    } else if (user.patientProfile) {
      await unlockPatient(user.id, off);
    } else {
      // Patient without a profile yet, or a bare user — flip the account flag only.
      await prisma.user.update({ where: { id: user.id }, data: { isActive: !off } });
      console.log(`  · no org/patient profile — set user.isActive=${!off}`);
    }
    console.log("");
  }

  console.log("Done. Users may need to sign out and back in for the change to take effect.");
}

main()
  .catch((e) => {
    console.error("activate-access failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
