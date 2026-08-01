import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function exportData() {
  const prisma = new PrismaClient();
  
  console.log('Fetching local data...');
  const data = {
    organizations: await prisma.organization.findMany(),
    users: await prisma.user.findMany(),
    memberships: await prisma.membership.findMany(),
    partnerCodes: await prisma.partnerCode.findMany(),
    patientProfiles: await prisma.patientProfile.findMany(),
    consents: await prisma.consent.findMany(),
    clinicalNotes: await prisma.clinicalNote.findMany(),
    therapyLogs: await prisma.therapyLog.findMany(),
    telemedicineSessions: await prisma.telemedicineSession.findMany(),
  };

  fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
  console.log('✅ Exported all local data to data-export.json');
  await prisma.$disconnect();
}

exportData().catch(console.error);
