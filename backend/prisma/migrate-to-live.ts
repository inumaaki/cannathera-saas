import { PrismaClient } from '@prisma/client';

async function migrate() {
  const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cannathera_saas';
  const liveUrl = process.env.LIVE_DATABASE_URL;

  if (!liveUrl) {
    console.error('ERROR: LIVE_DATABASE_URL environment variable is required.');
    console.error('Usage: LIVE_DATABASE_URL="postgresql://..." npx tsx prisma/migrate-to-live.ts');
    process.exit(1);
  }

  console.log(`Connecting to LOCAL database at ${localUrl.split('@')[1]}...`);
  const localPrisma = new PrismaClient({
    datasourceUrl: localUrl,
  });

  console.log(`Connecting to LIVE database at ${liveUrl.split('@')[1]}...`);
  const livePrisma = new PrismaClient({
    datasourceUrl: liveUrl,
  });

  try {
    // 1. Organizations
    console.log('\n--- Migrating Organizations ---');
    const orgs = await localPrisma.organization.findMany();
    for (const org of orgs) {
      await livePrisma.organization.upsert({
        where: { id: org.id },
        update: org,
        create: org,
      });
    }
    console.log(`✅ Migrated ${orgs.length} organizations.`);

    // 2. Users
    console.log('\n--- Migrating Users ---');
    const users = await localPrisma.user.findMany();
    for (const user of users) {
      await livePrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`✅ Migrated ${users.length} users.`);

    // 3. Memberships
    console.log('\n--- Migrating Memberships ---');
    const memberships = await localPrisma.membership.findMany();
    for (const m of memberships) {
      await livePrisma.membership.upsert({
        where: { id: m.id },
        update: m,
        create: m,
      });
    }
    console.log(`✅ Migrated ${memberships.length} memberships.`);

    // 4. Partner Codes
    console.log('\n--- Migrating Partner Codes ---');
    const partnerCodes = await localPrisma.partnerCode.findMany();
    for (const pc of partnerCodes) {
      await livePrisma.partnerCode.upsert({
        where: { id: pc.id },
        update: pc,
        create: pc,
      });
    }
    console.log(`✅ Migrated ${partnerCodes.length} partner codes.`);

    // 5. Patient Profiles
    console.log('\n--- Migrating Patient Profiles ---');
    const patientProfiles = await localPrisma.patientProfile.findMany();
    for (const pp of patientProfiles) {
      await livePrisma.patientProfile.upsert({
        where: { id: pp.id },
        update: pp,
        create: pp,
      });
    }
    console.log(`✅ Migrated ${patientProfiles.length} patient profiles.`);

    // 6. Consents
    console.log('\n--- Migrating Consents ---');
    const consents = await localPrisma.consent.findMany();
    for (const consent of consents) {
      await livePrisma.consent.upsert({
        where: { id: consent.id },
        update: consent,
        create: consent,
      });
    }
    console.log(`✅ Migrated ${consents.length} consents.`);

    // 7. Clinical Notes
    console.log('\n--- Migrating Clinical Notes ---');
    const notes = await localPrisma.clinicalNote.findMany();
    for (const note of notes) {
      await livePrisma.clinicalNote.upsert({
        where: { id: note.id },
        update: note,
        create: note,
      });
    }
    console.log(`✅ Migrated ${notes.length} clinical notes.`);

    // 8. Therapy Logs
    console.log('\n--- Migrating Therapy Logs ---');
    const logs = await localPrisma.therapyLog.findMany();
    for (const log of logs) {
      await livePrisma.therapyLog.upsert({
        where: { id: log.id },
        update: log,
        create: log,
      });
    }
    console.log(`✅ Migrated ${logs.length} therapy logs.`);

    // 9. Telemedicine Sessions
    console.log('\n--- Migrating Telemedicine Sessions ---');
    const sessions = await localPrisma.telemedicineSession.findMany();
    for (const session of sessions) {
      await livePrisma.telemedicineSession.upsert({
        where: { id: session.id },
        update: session,
        create: session,
      });
    }
    console.log(`✅ Migrated ${sessions.length} telemedicine sessions.`);

    console.log('\n🎉 Migration complete!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await localPrisma.$disconnect();
    await livePrisma.$disconnect();
  }
}

migrate();
