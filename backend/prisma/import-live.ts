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
    for (const org of data.organizations) {
      await prisma.organization.upsert({ where: { id: org.id }, update: org, create: org });
    }
    console.log(`✅ Imported ${data.organizations.length} organizations`);

    for (const user of data.users) {
      await prisma.user.upsert({ where: { id: user.id }, update: user, create: user });
    }
    console.log(`✅ Imported ${data.users.length} users`);

    for (const m of data.memberships) {
      await prisma.membership.upsert({ where: { id: m.id }, update: m, create: m });
    }
    console.log(`✅ Imported ${data.memberships.length} memberships`);

    for (const pc of data.partnerCodes) {
      await prisma.partnerCode.upsert({ where: { id: pc.id }, update: pc, create: pc });
    }
    console.log(`✅ Imported ${data.partnerCodes.length} partner codes`);

    for (const pp of data.patientProfiles) {
      // Fix ISO date strings back to Date objects if needed by Prisma
      if (pp.dateOfBirth) pp.dateOfBirth = new Date(pp.dateOfBirth);
      if (pp.therapyStart) pp.therapyStart = new Date(pp.therapyStart);
      if (pp.lastReviewAt) pp.lastReviewAt = new Date(pp.lastReviewAt);
      
      await prisma.patientProfile.upsert({ where: { id: pp.id }, update: pp, create: pp });
    }
    console.log(`✅ Imported ${data.patientProfiles.length} patient profiles`);

    for (const consent of data.consents) {
      if (consent.grantedAt) consent.grantedAt = new Date(consent.grantedAt);
      if (consent.revokedAt) consent.revokedAt = new Date(consent.revokedAt);
      await prisma.consent.upsert({ where: { id: consent.id }, update: consent, create: consent });
    }
    console.log(`✅ Imported ${data.consents.length} consents`);

    for (const note of data.clinicalNotes) {
      await prisma.clinicalNote.upsert({ where: { id: note.id }, update: note, create: note });
    }
    console.log(`✅ Imported ${data.clinicalNotes.length} clinical notes`);

    for (const log of data.therapyLogs) {
      if (log.loggedAt) log.loggedAt = new Date(log.loggedAt);
      await prisma.therapyLog.upsert({ where: { id: log.id }, update: log, create: log });
    }
    console.log(`✅ Imported ${data.therapyLogs.length} therapy logs`);

    for (const session of data.telemedicineSessions) {
      if (session.scheduledAt) session.scheduledAt = new Date(session.scheduledAt);
      await prisma.telemedicineSession.upsert({ where: { id: session.id }, update: session, create: session });
    }
    console.log(`✅ Imported ${data.telemedicineSessions.length} telemedicine sessions`);

    console.log('🎉 Import complete!');
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
