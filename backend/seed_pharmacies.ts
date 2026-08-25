import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pharmacies...');

  const pharmacies = [
    {
      name: 'Apotheke am Rathaus',
      type: 'PHARMACY' as const,
      postalCode: '10115',
      city: 'Berlin',
      street: 'Rathausstraße 1',
      lat: 52.5186,
      lng: 13.4081,
    },
    {
      name: 'Cannabis Care Pharmacy',
      type: 'PHARMACY' as const,
      postalCode: '80331',
      city: 'München',
      street: 'Marienplatz 2',
      lat: 48.1371,
      lng: 11.5754,
    },
    {
      name: 'Grüne Apotheke Köln',
      type: 'PHARMACY' as const,
      postalCode: '50667',
      city: 'Köln',
      street: 'Hohe Str. 40',
      lat: 50.9383,
      lng: 6.9554,
    }
  ];

  for (const data of pharmacies) {
    await prisma.organization.create({
      data
    });
  }

  console.log('Done seeding pharmacies.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
