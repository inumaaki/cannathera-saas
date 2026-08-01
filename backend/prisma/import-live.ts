import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function importData() {
  if (!fs.existsSync('data-export.json')) {
    console.error('ERROR: data-export.json not found!');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const raw = fs.readFileSync('data-export.json', 'utf8');
  const data = JSON.parse(raw);

  console.log('Connected to Database. Starting import...');

  try {
    // ── Organizations ─────────────────────────────────────────────────────────
    for (const org of data.organizations) {
      const { id, ...rest } = org;
      await prisma.organization.upsert({
        where: { id },
        update: rest,
        create: org,
      });
    }
    console.log(`✅ Imported ${data.organizations.length} organizations`);

    // ── Users ─────────────────────────────────────────────────────────────────
    // upsert by ID; if that ID doesn't exist but the email does (e.g. a user
    // seeded by the setup-admin endpoint), merge by email instead.
    for (const user of data.users) {
      const { id, email, createdAt, updatedAt, ...mutableFields } = user;

      // Check if a different user already holds this email
      const existingByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingByEmail && existingByEmail.id !== id) {
        // Merge: update the existing row by email, skip creating a new one
        console.warn(
          `⚠️  Email "${email}" already exists with different id — updating existing row (${existingByEmail.id})`,
        );
        await prisma.user.update({
          where: { email },
          data: mutableFields,
        });
        continue;
      }

      // Normal upsert by primary key — do NOT include email or id in the update
      // payload to avoid hitting the unique constraint on UPDATE
      await prisma.user.upsert({
        where: { id },
        update: mutableFields,
        create: user,
      });
    }
    console.log(`✅ Imported ${data.users.length} users`);

    // ── Memberships ───────────────────────────────────────────────────────────
    for (const m of data.memberships) {
      const { id, ...rest } = m;
      await prisma.membership.upsert({
        where: { id },
        update: rest,
        create: m,
      });
    }
    console.log(`✅ Imported ${data.memberships.length} memberships`);

    // ── Partner Codes ─────────────────────────────────────────────────────────
    for (const pc of data.partnerCodes) {
      const { id, code, ...rest } = pc;
      // PartnerCode has a unique constraint on `code` too — upsert by id only
      // and exclude `code` from the update payload
      await prisma.partnerCode.upsert({
        where: { id },
        update: rest,
        create: pc,
      });
    }
    console.log(`✅ Imported ${data.partnerCodes.length} partner codes`);

    // ── Patient Profiles ──────────────────────────────────────────────────────
    for (const pp of data.patientProfiles) {
      if (pp.dateOfBirth) pp.dateOfBirth = new Date(pp.dateOfBirth);
      if (pp.therapyStart) pp.therapyStart = new Date(pp.therapyStart);
      if (pp.lastReviewAt) pp.lastReviewAt = new Date(pp.lastReviewAt);
      const { id, userId, ...rest } = pp;
      await prisma.patientProfile.upsert({
        where: { id },
        update: rest,
        create: pp,
      });
    }
    console.log(`✅ Imported ${data.patientProfiles.length} patient profiles`);

    // ── Consents ──────────────────────────────────────────────────────────────
    for (const consent of data.consents) {
      if (consent.grantedAt) consent.grantedAt = new Date(consent.grantedAt);
      if (consent.revokedAt) consent.revokedAt = new Date(consent.revokedAt);
      const { id, ...rest } = consent;
      await prisma.consent.upsert({
        where: { id },
        update: rest,
        create: consent,
      });
    }
    console.log(`✅ Imported ${data.consents.length} consents`);

    // ── Clinical Notes ────────────────────────────────────────────────────────
    for (const note of data.clinicalNotes) {
      const { id, ...rest } = note;
      await prisma.clinicalNote.upsert({
        where: { id },
        update: rest,
        create: note,
      });
    }
    console.log(`✅ Imported ${data.clinicalNotes.length} clinical notes`);

    // ── Therapy Logs ──────────────────────────────────────────────────────────
    for (const log of data.therapyLogs) {
      if (log.loggedAt) log.loggedAt = new Date(log.loggedAt);
      const { id, ...rest } = log;
      await prisma.therapyLog.upsert({
        where: { id },
        update: rest,
        create: log,
      });
    }
    console.log(`✅ Imported ${data.therapyLogs.length} therapy logs`);

    // ── Telemedicine Sessions ─────────────────────────────────────────────────
    for (const session of data.telemedicineSessions) {
      if (session.scheduledAt) session.scheduledAt = new Date(session.scheduledAt);
      const { id, ...rest } = session;
      await prisma.telemedicineSession.upsert({
        where: { id },
        update: rest,
        create: session,
      });
    }
    console.log(`✅ Imported ${data.telemedicineSessions.length} telemedicine sessions`);

    console.log('🎉 Import complete!');
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
