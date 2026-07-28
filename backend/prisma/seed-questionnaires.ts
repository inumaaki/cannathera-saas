/* Seeds the two core questionnaires from the client's concept PDF:
   - anamnesis (Erstanamnese / intake)
   - monthly_review (Monatsreview — basis of the Monatsreport)
   German is canonical on the row; EN rows demonstrate the translation layer
   (TR/BG/AR fall back to German until translated, per pilot rule).
   Run: pnpm exec tsx prisma/seed-questionnaires.ts */
import { Locale, PrismaClient, QuestionType, RedFlagSeverity } from "@prisma/client";

const prisma = new PrismaClient();

type Opt = { value: string; de: string; en?: string };
type Q = {
  key: string;
  type: QuestionType;
  de: string;
  en?: string;
  help?: string;
  required?: boolean;
  config?: object;
  showIf?: object;
  options?: Opt[];
};
type Sec = { key: string; de: string; questions: Q[] };
type Flag = {
  key: string;
  severity: RedFlagSeverity;
  condition: object;
  message: string;
};

async function upsertQuestionnaire(
  key: string,
  title: string,
  description: string,
  sections: Sec[],
  flags: Flag[],
) {
  const questionnaire = await prisma.questionnaire.upsert({
    where: { key },
    update: { title, description },
    create: { key, title, description },
  });

  // New published version each seed run keeps history intact (versioning).
  const latest = await prisma.questionnaireVersion.findFirst({
    where: { questionnaireId: questionnaire.id },
    orderBy: { version: "desc" },
  });
  const version = await prisma.questionnaireVersion.create({
    data: {
      questionnaireId: questionnaire.id,
      version: (latest?.version ?? 0) + 1,
      isPublished: true,
    },
  });
  // Unpublish older versions (new submissions use the latest).
  await prisma.questionnaireVersion.updateMany({
    where: { questionnaireId: questionnaire.id, id: { not: version.id } },
    data: { isPublished: false },
  });

  for (const [si, sec] of sections.entries()) {
    const section = await prisma.section.create({
      data: { versionId: version.id, key: sec.key, title: sec.de, order: si },
    });
    for (const [qi, q] of sec.questions.entries()) {
      const question = await prisma.question.create({
        data: {
          sectionId: section.id,
          key: q.key,
          type: q.type,
          label: q.de,
          helpText: q.help,
          required: q.required ?? false,
          order: qi,
          config: q.config,
          showIf: q.showIf,
        },
      });
      if (q.en) {
        await prisma.questionTranslation.create({
          data: { questionId: question.id, locale: Locale.en, label: q.en },
        });
      }
      for (const [oi, opt] of (q.options ?? []).entries()) {
        const option = await prisma.questionOption.create({
          data: { questionId: question.id, value: opt.value, label: opt.de, order: oi },
        });
        if (opt.en) {
          await prisma.optionTranslation.create({
            data: { optionId: option.id, locale: Locale.en, label: opt.en },
          });
        }
      }
    }
  }

  for (const f of flags) {
    await prisma.redFlagRule.create({
      data: {
        versionId: version.id,
        key: f.key,
        severity: f.severity,
        condition: f.condition,
        message: f.message,
      },
    });
  }

  console.log(`Seeded ${key} v${version.version}`);
}

const scale10 = { min: 0, max: 10, step: 1 };

async function main() {
  // ------------------------------------------------------------- Erstanamnese
  await upsertQuestionnaire(
    "anamnesis",
    "Erstanamnese",
    "Analysebogen für den Erstkontakt — Grundlage Ihrer Therapiebegleitung.",
    [
      {
        key: "complaint",
        de: "Hauptbeschwerde",
        questions: [
          {
            key: "mainComplaint",
            type: QuestionType.SINGLE_CHOICE,
            de: "Was ist Ihre Hauptbeschwerde?",
            en: "What is your main complaint?",
            required: true,
            options: [
              { value: "chronic_pain", de: "Chronische Schmerzen", en: "Chronic pain" },
              { value: "sleep", de: "Schlafstörungen", en: "Sleep disorders" },
              { value: "appetite", de: "Appetitlosigkeit", en: "Loss of appetite" },
              { value: "spasticity", de: "Spastik", en: "Spasticity" },
              { value: "other", de: "Sonstiges", en: "Other" },
            ],
          },
          {
            key: "mainComplaintOther",
            type: QuestionType.TEXT,
            de: "Bitte beschreiben Sie Ihre Beschwerde",
            en: "Please describe your complaint",
            required: true,
            showIf: { q: "mainComplaint", op: "eq", value: "other" },
          },
          {
            key: "painNrs",
            type: QuestionType.SCALE,
            de: "Wie stark sind Ihre Schmerzen aktuell? (0 = keine, 10 = stärkste)",
            en: "How severe is your pain currently? (0 = none, 10 = worst)",
            required: true,
            config: scale10,
          },
          {
            key: "sleepQuality",
            type: QuestionType.SCALE,
            de: "Wie bewerten Sie Ihre Schlafqualität? (0 = sehr schlecht, 10 = sehr gut)",
            en: "How do you rate your sleep quality? (0 = very poor, 10 = very good)",
            required: true,
            config: scale10,
          },
        ],
      },
      {
        key: "history",
        de: "Vorgeschichte",
        questions: [
          {
            key: "preexisting",
            type: QuestionType.MULTI_CHOICE,
            de: "Bestehen Vorerkrankungen?",
            en: "Do you have pre-existing conditions?",
            options: [
              { value: "none", de: "Keine", en: "None" },
              { value: "cardio", de: "Herz-Kreislauf-Erkrankung", en: "Cardiovascular disease" },
              { value: "liver", de: "Lebererkrankung", en: "Liver disease" },
              { value: "psychiatric", de: "Psychiatrische Erkrankung", en: "Psychiatric condition" },
              { value: "other", de: "Sonstige", en: "Other" },
            ],
          },
          {
            key: "psychosisHistory",
            type: QuestionType.BOOLEAN,
            de: "Gab es bei Ihnen oder in Ihrer Familie Psychosen oder Schizophrenie?",
            en: "Is there a history of psychosis or schizophrenia (you or your family)?",
            required: true,
          },
          {
            key: "pregnant",
            type: QuestionType.BOOLEAN,
            de: "Besteht eine Schwangerschaft oder stillen Sie derzeit?",
            en: "Are you currently pregnant or breastfeeding?",
            required: true,
          },
          {
            key: "medications",
            type: QuestionType.TEXTAREA,
            de: "Welche Medikamente nehmen Sie aktuell ein?",
            en: "Which medications are you currently taking?",
          },
          {
            key: "cannabisExperience",
            type: QuestionType.BOOLEAN,
            de: "Haben Sie bereits Erfahrung mit medizinischem Cannabis?",
            en: "Do you have prior experience with medical cannabis?",
            required: true,
          },
          {
            key: "cannabisDetails",
            type: QuestionType.TEXTAREA,
            de: "Welche Produkte/Dosierungen haben Sie bisher verwendet?",
            en: "Which products/dosages have you used so far?",
            showIf: { q: "cannabisExperience", op: "eq", value: true },
          },
        ],
      },
      {
        key: "goals",
        de: "Therapieziele",
        questions: [
          {
            key: "goals",
            type: QuestionType.MULTI_CHOICE,
            de: "Welche Ziele möchten Sie mit der Therapie erreichen?",
            en: "Which goals do you want to achieve with the therapy?",
            required: true,
            options: [
              { value: "pain_relief", de: "Schmerzlinderung", en: "Pain relief" },
              { value: "sleep", de: "Schlafverbesserung", en: "Sleep improvement" },
              { value: "activity", de: "Aktivitätssteigerung", en: "Increased activity" },
              { value: "qol", de: "Lebensqualität verbessern", en: "Improve quality of life" },
            ],
          },
        ],
      },
    ],
    [
      {
        key: "pregnancy",
        severity: RedFlagSeverity.CRITICAL,
        condition: { q: "pregnant", op: "eq", value: true },
        message:
          "Schwangerschaft/Stillzeit angegeben — Cannabis-Therapie kontraindiziert. Ärztliche Prüfung erforderlich.",
      },
      {
        key: "psychosis",
        severity: RedFlagSeverity.CRITICAL,
        condition: { q: "psychosisHistory", op: "eq", value: true },
        message:
          "Psychose-/Schizophrenie-Historie angegeben — erhöhtes Risiko. Ärztliche Prüfung erforderlich.",
      },
      {
        key: "cardio",
        severity: RedFlagSeverity.WARNING,
        condition: { q: "preexisting", op: "includes", value: "cardio" },
        message: "Herz-Kreislauf-Vorerkrankung — Dosierung mit Vorsicht wählen.",
      },
      {
        key: "severe_pain",
        severity: RedFlagSeverity.WARNING,
        condition: { q: "painNrs", op: "gte", value: 9 },
        message: "Sehr starke Schmerzen (NRS ≥ 9) — zeitnahe ärztliche Abklärung empfohlen.",
      },
    ],
  );

  // ----------------------------------------------------------- Monatsreview
  await upsertQuestionnaire(
    "monthly_review",
    "Monatsreview",
    "Detaillierter monatlicher Verlaufsbogen — Grundlage Ihres medizinischen Monatsreports.",
    [
      {
        key: "progress",
        de: "1. Symptomverlauf & Wohlbefinden",
        questions: [
          {
            key: "painNrs",
            type: QuestionType.SCALE,
            de: "Schmerzstärke im Durchschnitt (NRS 0–10)",
            en: "Average pain level (NRS 0–10)",
            required: true,
            config: scale10,
          },
          {
            key: "painDescription",
            type: QuestionType.TEXTAREA,
            de: "Beschreiben Sie Ihren Schmerzverlauf in eigenen Worten (z. B. Schmerzspitzen, Tageszeiten, Linderung durch Anwendung)",
            en: "Describe your pain course in your own words (e.g. pain peaks, time of day, relief through application)",
            required: false,
          },
          {
            key: "sleepHours",
            type: QuestionType.NUMBER,
            de: "Durchschnittliche Schlafdauer pro Nacht (Stunden)",
            en: "Average sleep per night (hours)",
            required: true,
            config: { min: 0, max: 14, step: 0.5, unit: "h" },
          },
          {
            key: "sleepQualityDetails",
            type: QuestionType.TEXTAREA,
            de: "Bemerkungen zum Schlaf (z. B. Einschlafzeit, Durchschlafstörungen, Alpträume)",
            en: "Notes on sleep (e.g. time to fall asleep, sleep continuity, nightmares)",
            required: false,
          },
          {
            key: "activity",
            type: QuestionType.SCALE,
            de: "Aktivitätsniveau im Alltag (0–10)",
            en: "Daily activity level (0–10)",
            required: true,
            config: scale10,
          },
          {
            key: "qol",
            type: QuestionType.SCALE,
            de: "Allgemeine Lebensqualität (0–10)",
            en: "Overall quality of life (0–10)",
            required: true,
            config: scale10,
          },
        ],
      },
      {
        key: "application",
        de: "2. Sorte, Anwendung & Dosierung",
        questions: [
          {
            key: "strainUsed",
            type: QuestionType.TEXT,
            de: "Aktuell verwendete Sorte(n) / Präparat(e)",
            en: "Currently used strain(s) / preparation(s)",
            help: "Geben Sie die genaue Bezeichnung Ihrer Apothekensorte oder Ihres Extrakts ein",
            required: false,
          },
          {
            key: "intakeMethod",
            type: QuestionType.SINGLE_CHOICE,
            de: "Hauptsächliche Darreichungsform",
            en: "Primary intake method",
            required: true,
            options: [
              { value: "vaporizer", de: "Vaporisator (Verdampfung)", en: "Vaporizer (Inhalation)" },
              { value: "extract_oil", de: "Extrakt / Tropfen (Oral/Sublingual)", en: "Extract / Drops (Oral/Sublingual)" },
              { value: "capsules", de: "Kapseln", en: "Capsules" },
              { value: "tea", de: "Tee-Zubereitung", en: "Tea preparation" },
              { value: "other", de: "Sonstige", en: "Other" },
            ],
          },
          {
            key: "dosageChanges",
            type: QuestionType.TEXTAREA,
            de: "Gab es im Verlauf des Monats Dosisschwankungen oder Anpassungen? Warum?",
            en: "Were there dosage fluctuations or adjustments during the month? Why?",
            required: false,
          },
        ],
      },
      {
        key: "tolerability",
        de: "3. Verträglichkeit & Nebenwirkungen",
        questions: [
          {
            key: "sideEffects",
            type: QuestionType.MULTI_CHOICE,
            de: "Welche Nebenwirkungen sind aufgetreten?",
            en: "Which side effects occurred?",
            required: true,
            options: [
              { value: "none", de: "Keine Nebenwirkungen", en: "No side effects" },
              { value: "fatigue", de: "Müdigkeit / Sedierung", en: "Fatigue / Sedation" },
              { value: "dizziness", de: "Schwindel / Benommenheit", en: "Dizziness / Lightheadedness" },
              { value: "dry_mouth", de: "Mundtrockenheit", en: "Dry mouth" },
              { value: "palpitations", de: "Herzrasen / Tachykardie", en: "Palpitations / Tachycardia" },
              { value: "anxiety", de: "Angst / Innere Unruhe", en: "Anxiety / Restlessness" },
              { value: "cough", de: "Husten / Atemwegsreizung", en: "Cough / Airway irritation" },
              { value: "other", de: "Sonstige Nebenwirkungen", en: "Other side effects" },
            ],
          },
          {
            key: "sideEffectsDetails",
            type: QuestionType.TEXTAREA,
            de: "Bitte beschreiben Sie die Nebenwirkungen und deren Verlauf im Detail",
            en: "Please describe the side effects and their development in detail",
            required: false,
            showIf: { not: { q: "sideEffects", op: "includes", value: "none" } },
          },
          {
            key: "sideEffectsSevere",
            type: QuestionType.BOOLEAN,
            de: "Waren die Nebenwirkungen so stark, dass sie Ihren Alltag oder Ihre Arbeit beeinträchtigt haben?",
            en: "Were the side effects severe enough to affect your daily life or work?",
            required: true,
            showIf: { not: { q: "sideEffects", op: "includes", value: "none" } },
          },
        ],
      },
      {
        key: "assessment",
        de: "4. Wirksamkeit & Zielerreichung",
        questions: [
          {
            key: "goalsReached",
            type: QuestionType.SINGLE_CHOICE,
            de: "Wurden Ihre persönlichen Therapieziele in diesem Monat erreicht?",
            en: "Were your personal therapy goals achieved this month?",
            required: true,
            options: [
              { value: "yes", de: "Ja, voll erreicht", en: "Yes, fully achieved" },
              { value: "partial", de: "Teilweise erreicht", en: "Partially achieved" },
              { value: "no", de: "Nein, nicht erreicht", en: "No, not achieved" },
            ],
          },
          {
            key: "improvementsDetail",
            type: QuestionType.TEXTAREA,
            de: "Was hat sich in diesem Monat am spürbarsten verbessert?",
            en: "What showed the most noticeable improvement this month?",
            required: false,
          },
          {
            key: "unresolvedIssues",
            type: QuestionType.TEXTAREA,
            de: "Welche Beschwerden sind weiterhin störend oder unbehandelt?",
            en: "Which symptoms remain bothersome or untreated?",
            required: false,
          },
          {
            key: "satisfaction",
            type: QuestionType.SCALE,
            de: "Gesamtzufriedenheit mit der aktuellen Cannabis-Therapie (0–10)",
            en: "Overall satisfaction with current cannabis therapy (0–10)",
            required: true,
            config: scale10,
          },
        ],
      },
      {
        key: "notes",
        de: "5. Rückmeldung & Arztkontakt",
        questions: [
          {
            key: "notes",
            type: QuestionType.TEXTAREA,
            de: "Besondere Ereignisse, Urlaube oder Veränderungen der Lebensumstände",
            en: "Special events, vacations, or changes in living circumstances",
            required: false,
          },
          {
            key: "doctorQuestions",
            type: QuestionType.TEXTAREA,
            de: "Fragen oder Anpassungswünsche für das nächste Arztgespräch",
            en: "Questions or adjustment requests for your next medical consultation",
            required: false,
          },
        ],
      },
    ],
    [
      {
        key: "severe_pain",
        severity: RedFlagSeverity.CRITICAL,
        condition: { q: "painNrs", op: "gte", value: 9 },
        message: "Sehr starke Schmerzen (NRS ≥ 9) — ärztliche Prüfung erforderlich.",
      },
      {
        key: "severe_side_effects",
        severity: RedFlagSeverity.CRITICAL,
        condition: { q: "sideEffectsSevere", op: "eq", value: true },
        message: "Stark beeinträchtigende Nebenwirkungen — ärztliche Prüfung erforderlich.",
      },
      {
        key: "palpitations",
        severity: RedFlagSeverity.WARNING,
        condition: { q: "sideEffects", op: "includes", value: "palpitations" },
        message: "Herzrasen als Nebenwirkung — Verlauf beobachten, ggf. Dosis prüfen.",
      },
      {
        key: "anxiety",
        severity: RedFlagSeverity.WARNING,
        condition: { q: "sideEffects", op: "includes", value: "anxiety" },
        message: "Angst/Unruhe als Nebenwirkung — Verlauf beobachten.",
      },
      {
        key: "low_sleep",
        severity: RedFlagSeverity.WARNING,
        condition: { q: "sleepHours", op: "lte", value: 3 },
        message: "Sehr geringe Schlafdauer (≤ 3 h) — Therapie ggf. anpassen.",
      },
    ],
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
