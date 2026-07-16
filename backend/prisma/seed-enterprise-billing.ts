/* Invoice history + a demo webhook for the Enterprise Billing and API screens.
   Run: pnpm exec tsx prisma/seed-enterprise-billing.ts */
import { InvoiceStatus, OrgType, PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const TIERS = { 1: 8, 2: 6.5, 3: 5 } as const;

async function main() {
  const org = await prisma.organization.findFirst({
    where: { type: OrgType.ENTERPRISE, name: "GreenPath Health Group" },
  });
  if (!org) {
    console.log("Run seed-enterprise.ts first.");
    return;
  }

  // Six months of closed invoices, most recent one still pending.
  const now = new Date();
  const history = [
    { back: 1, reviews: 181, tier: 2 as const, status: InvoiceStatus.PENDING },
    { back: 2, reviews: 223, tier: 2 as const, status: InvoiceStatus.PAID },
    { back: 3, reviews: 196, tier: 2 as const, status: InvoiceStatus.PAID },
    { back: 4, reviews: 112, tier: 1 as const, status: InvoiceStatus.PAID },
    { back: 5, reviews: 98, tier: 1 as const, status: InvoiceStatus.PAID },
    { back: 6, reviews: 74, tier: 1 as const, status: InvoiceStatus.OVERDUE },
  ];

  let created = 0;
  for (const [i, h] of history.entries()) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - h.back, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - h.back + 1, 1);
    const exists = await prisma.invoice.findFirst({
      where: { orgId: org.id, periodStart },
    });
    if (exists) continue;

    const unitPrice = TIERS[h.tier];
    await prisma.invoice.create({
      data: {
        orgId: org.id,
        number: `INV-${periodStart.getFullYear()}-${String(900 + history.length - i).padStart(4, "0")}`,
        periodStart,
        periodEnd,
        tier: `Tier ${h.tier}`,
        reviews: h.reviews,
        unitPrice,
        amount: Math.round(h.reviews * unitPrice * 100) / 100,
        status: h.status,
        issuedAt: periodEnd,
        paidAt: h.status === InvoiceStatus.PAID ? periodEnd : null,
      },
    });
    created++;
  }

  // A webhook endpoint so the delivery log + integration cards have real data.
  const hookUrl = "https://hook.eu2.make.com/cannathera-demo-endpoint";
  let hook = await prisma.webhookEndpoint.findFirst({
    where: { orgId: org.id, url: hookUrl },
  });
  if (!hook) {
    hook = await prisma.webhookEndpoint.create({
      data: {
        orgId: org.id,
        url: hookUrl,
        events: ["patient.created", "report.finalized", "alert.triggered"],
        secret: `whsec_${randomBytes(16).toString("base64url")}`,
      },
    });
  }

  const deliveries = await prisma.webhookDelivery.count({
    where: { endpointId: hook.id },
  });
  if (deliveries === 0) {
    const MIN = 60_000;
    await prisma.webhookDelivery.createMany({
      data: [
        { endpointId: hook.id, event: "patient.created", payload: { patientRef: "CT-8218-PH" }, statusCode: 200, ok: true, deliveredAt: new Date(Date.now() - 12 * MIN), createdAt: new Date(Date.now() - 12 * MIN) },
        { endpointId: hook.id, event: "report.finalized", payload: { type: "MONTHLY" }, statusCode: 200, ok: true, deliveredAt: new Date(Date.now() - 25 * MIN), createdAt: new Date(Date.now() - 25 * MIN) },
        { endpointId: hook.id, event: "alert.triggered", payload: { severity: "CRITICAL" }, statusCode: 502, ok: false, error: "HTTP 502", attempts: 2, createdAt: new Date(Date.now() - 48 * MIN) },
        { endpointId: hook.id, event: "session.updated", payload: { status: "scheduled" }, statusCode: 201, ok: true, deliveredAt: new Date(Date.now() - 70 * MIN), createdAt: new Date(Date.now() - 70 * MIN) },
      ],
    });
  }

  console.log(`Enterprise billing seeded: ${created} invoices, webhook ${hook.url}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
