/* Purge script: remove demo accounts and clinical mockup data from the DB.
   Run: pnpm exec tsx prisma/purge-demo.ts */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting demo data purge...");

  // 1. Delete transient clinical data
  const delLogs = await prisma.therapyLog.deleteMany({});
  console.log(`Deleted ${delLogs.count} therapy logs.`);

  const delNotes = await prisma.clinicalNote.deleteMany({});
  console.log(`Deleted ${delNotes.count} clinical notes.`);

  const delSessions = await prisma.telemedicineSession.deleteMany({});
  console.log(`Deleted ${delSessions.count} telemedicine sessions.`);

  const delReports = await prisma.report.deleteMany({});
  console.log(`Deleted ${delReports.count} reports.`);

  const delFlags = await prisma.redFlagHit.deleteMany({});
  console.log(`Deleted ${delFlags.count} red flag hits.`);

  const delAnswers = await prisma.answer.deleteMany({});
  console.log(`Deleted ${delAnswers.count} questionnaire answers.`);

  const delSubmissions = await prisma.submission.deleteMany({});
  console.log(`Deleted ${delSubmissions.count} submissions.`);

  const delInvoices = await prisma.invoice.deleteMany({});
  console.log(`Deleted ${delInvoices.count} invoices.`);

  const delAudit = await prisma.auditLog.deleteMany({});
  console.log(`Deleted ${delAudit.count} audit logs.`);

  // 2. Delete consents, 2FA codes, and password resets for deleted users
  const delConsents = await prisma.consent.deleteMany({
    where: { user: { email: { not: "admin@cannathera.de" } } },
  });
  console.log(`Deleted ${delConsents.count} consents.`);

  const del2fa = await prisma.twoFactorCode.deleteMany({
    where: { user: { email: { not: "admin@cannathera.de" } } },
  });
  console.log(`Deleted ${del2fa.count} 2FA codes.`);

  const delResets = await prisma.passwordResetToken.deleteMany({
    where: { user: { email: { not: "admin@cannathera.de" } } },
  });
  console.log(`Deleted ${delResets.count} reset tokens.`);

  // 3. Delete all users except admin@cannathera.de (cascades memberships, profiles, etc.)
  const delUsers = await prisma.user.deleteMany({
    where: { email: { not: "admin@cannathera.de" } },
  });
  console.log(`Deleted ${delUsers.count} user profiles.`);

  // 4. Delete all organizations
  const delOrgs = await prisma.organization.deleteMany({});
  console.log(`Deleted ${delOrgs.count} organizations.`);

  console.log("Demo data purge completed successfully.");
}

main()
  .catch((e) => {
    console.error("Purge failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
