import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hoursA = [
    { day: "Montag", open: "08:00", close: "18:00", closed: false },
    { day: "Dienstag", open: "08:00", close: "18:00", closed: false },
    { day: "Mittwoch", open: "08:00", close: "13:00", closed: false },
    { day: "Donnerstag", open: "08:00", close: "18:00", closed: false },
    { day: "Freitag", open: "08:00", close: "13:00", closed: false },
    { day: "Samstag", open: "Geschlossen", close: "", closed: true },
    { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
  ];

  const hoursB = [
    { day: "Montag", open: "08:30", close: "17:30", closed: false },
    { day: "Dienstag", open: "08:30", close: "17:30", closed: false },
    { day: "Mittwoch", open: "08:30", close: "13:00", closed: false },
    { day: "Donnerstag", open: "08:30", close: "17:30", closed: false },
    { day: "Freitag", open: "08:30", close: "14:00", closed: false },
    { day: "Samstag", open: "Geschlossen", close: "", closed: true },
    { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
  ];

  await prisma.organization.updateMany({
    where: { name: "Dr. Smith Clinic" },
    data: {
      street: "Friedrichstraße 140",
      postalCode: "10117",
      city: "Berlin",
      phone: "+49 30 20963000",
      email: "praxis@drsmith-berlin.de",
      website: "https://drsmith-berlin.de",
      description:
        "Schwerpunktpraxis für chronische Schmerzsyndrome, Palliativmedizin und Cannabinoidtherapie.",
      branding: {
        specialty: "Spezielle Schmerztherapie",
        practiceType: "pain",
      },
      operatingHours: hoursA,
    },
  });

  await prisma.organization.updateMany({
    where: { name: "New Orb" },
    data: {
      street: "Maximilianstraße 35",
      postalCode: "80539",
      city: "München",
      phone: "+49 89 210200",
      email: "kontakt@praxis-neworb.de",
      website: "https://praxis-neworb.de",
      description:
        "Ganzheitliche Allgemeinmedizin, Schmerztherapie und phytotherapeutische Begleitung.",
      branding: {
        specialty: "Allgemeinmedizin & Naturheilverfahren",
        practiceType: "general",
      },
      operatingHours: hoursB,
    },
  });

  await prisma.organization.updateMany({
    where: { name: "Testing-Doc-Clinic" },
    data: {
      street: "Neuer Wall 63",
      postalCode: "20354",
      city: "Hamburg",
      phone: "+49 40 34990",
      email: "info@doc-clinic-nord.de",
      website: "https://doc-clinic-nord.de",
      description:
        "Fachpraxis für Neurologie, Kopfschmerzbehandlung und integrative Schmerztherapie.",
      branding: {
        specialty: "Neurologie & Spezielle Schmerztherapie",
        practiceType: "pain",
      },
      operatingHours: hoursA,
    },
  });

  console.log("Updated sample practices with specialty, location, and operating hours!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
