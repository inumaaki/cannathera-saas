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
      const { id, ...rest } = org;
      await livePrisma.organization.upsert({
        where: { id },
        update: rest,
        create: org,
      });
    }
    console.log(`✅ Migrated ${orgs.length} organizations.`);

    // 2. Users
    console.log('\n--- Migrating Users ---');
    const users = await localPrisma.user.findMany();
    for (const user of users) {
      const { id, email, createdAt, updatedAt, ...mutableFields } = user;
      
      const existingByEmail = await livePrisma.user.findUnique({ where: { email } });
      if (existingByEmail && existingByEmail.id !== id) {
        console.warn(`⚠️  Email "${email}" exists with a different ID. Updating existing record.`);
        await livePrisma.user.update({
          where: { email },
          data: mutableFields,
        });
        continue;
      }

      await livePrisma.user.upsert({
        where: { id },
        update: mutableFields,
        create: user,
      });
    }
    console.log(`✅ Migrated ${users.length} users.`);

    // 3. Memberships
    console.log('\n--- Migrating Memberships ---');
    const memberships = await localPrisma.membership.findMany();
    for (const m of memberships) {
      const { id, ...rest } = m;
      await livePrisma.membership.upsert({
        where: { id },
        update: rest,
        create: m,
      });
    }
    console.log(`✅ Migrated ${memberships.length} memberships.`);

    // 4. Partner Codes
    console.log('\n--- Migrating Partner Codes ---');
    const partnerCodes = await localPrisma.partnerCode.findMany();
    for (const pc of partnerCodes) {
      const { id, code, ...rest } = pc;
      await livePrisma.partnerCode.upsert({
        where: { id },
        update: rest,
        create: pc,
      });
    }
    console.log(`✅ Migrated ${partnerCodes.length} partner codes.`);

    // 5. Patient Profiles
    console.log('\n--- Migrating Patient Profiles ---');
    const patientProfiles = await localPrisma.patientProfile.findMany();
    for (const pp of patientProfiles) {
      // Strip out the new columns that don't exist on the live database yet
      const { 
        id, 
        userId, 
        address, 
        phone, 
        mainComplaints, 
        complaintsDescription, 
        therapyGoals, 
        baselineMetrics, 
        onboardingCompleted, 
        hasActiveSubscription, 
        ...rest 
      } = pp as any; // Cast to any because TS doesn't know about the stripped fields if they are not in the generated client

      await livePrisma.patientProfile.upsert({
        where: { id },
        update: rest,
        create: { ...rest, id, userId },
      });
    }
    console.log(`✅ Migrated ${patientProfiles.length} patient profiles.`);

    // 6. Consents
    console.log('\n--- Migrating Consents ---');
    const consents = await localPrisma.consent.findMany();
    for (const consent of consents) {
      const { id, ...rest } = consent;
      await livePrisma.consent.upsert({
        where: { id },
        update: rest,
        create: consent,
      });
    }
    console.log(`✅ Migrated ${consents.length} consents.`);

    // 7. Clinical Notes
    console.log('\n--- Migrating Clinical Notes ---');
    const notes = await localPrisma.clinicalNote.findMany();
    for (const note of notes) {
      const { id, ...rest } = note;
      await livePrisma.clinicalNote.upsert({
        where: { id },
        update: rest,
        create: note,
      });
    }
    console.log(`✅ Migrated ${notes.length} clinical notes.`);

    // 8. Therapy Logs
    console.log('\n--- Migrating Therapy Logs ---');
    const logs = await localPrisma.therapyLog.findMany();
    for (const log of logs) {
      // Strip out the new columns that don't exist on the live database yet
      const { 
        id, 
        batchNumber, 
        consumptionMethod, 
        manufacturer, 
        ...rest 
      } = log as any;

      await livePrisma.therapyLog.upsert({
        where: { id },
        update: rest,
        create: { ...rest, id },
      });
    }
    console.log(`✅ Migrated ${logs.length} therapy logs.`);

    // 9. Telemedicine Sessions
    console.log('\n--- Migrating Telemedicine Sessions ---');
    const sessions = await localPrisma.telemedicineSession.findMany();
    for (const session of sessions) {
      const { id, ...rest } = session;
      await livePrisma.telemedicineSession.upsert({
        where: { id },
        update: rest,
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
