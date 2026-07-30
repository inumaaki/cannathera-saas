const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'messages');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const quickLogAdditions = {
  de: {
    batchNumberTitle: "Chargennummer",
    batchNumberPlaceholder: "z.B. CH123456",
    manufacturerTitle: "Hersteller",
    manufacturerPlaceholder: "z.B. Aurora, Bedrocan",
    consumptionMethodTitle: "Einnahmemethode",
    intensity_mild: "Leicht",
    intensity_moderate: "Mittel",
    intensity_severe: "Schwer"
  },
  en: {
    batchNumberTitle: "Batch Number",
    batchNumberPlaceholder: "e.g. BATCH-123",
    manufacturerTitle: "Manufacturer",
    manufacturerPlaceholder: "e.g. Aurora, Bedrocan",
    consumptionMethodTitle: "Method of Consumption",
    intensity_mild: "Mild",
    intensity_moderate: "Moderate",
    intensity_severe: "Severe"
  },
  tr: {
    batchNumberTitle: "Parti Numarası",
    batchNumberPlaceholder: "örn. PARTI-123",
    manufacturerTitle: "Üretici",
    manufacturerPlaceholder: "örn. Aurora, Bedrocan",
    consumptionMethodTitle: "Tüketim Yöntemi",
    intensity_mild: "Hafif",
    intensity_moderate: "Orta",
    intensity_severe: "Şiddetli"
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let data = JSON.parse(content);

  const lang = file.replace('.json', '');
  const additions = quickLogAdditions[lang] || quickLogAdditions['en'];

  // 1. Add quickLog fields
  if (data.patient && data.patient.quickLog) {
    data.patient.quickLog = {
      ...data.patient.quickLog,
      ...additions
    };
  }

  // 2. Replace 90-day / 90-Tage references globally in the JSON string
  let updatedContent = JSON.stringify(data, null, 2);

  if (lang === 'de') {
    updatedContent = updatedContent.replace(/90-Tage-Plan/g, "Strukturierter Therapieplan");
    updatedContent = updatedContent.replace(/des 90-Tage-Plans/g, "des strukturierten Therapieplans");
    updatedContent = updatedContent.replace(/90-Tage-Fortschritt/g, "Therapiefortschritt");
    updatedContent = updatedContent.replace(/90-Tage-Verlauf/g, "Therapieverlauf");
    updatedContent = updatedContent.replace(/90-Tage-Therapieplan/g, "Strukturierter Therapieplan");
    updatedContent = updatedContent.replace(/90-Tage-Therapietreue/g, "Therapietreue");
    updatedContent = updatedContent.replace(/ein starrer 90-Tage-Sprint/g, "ein starrer Sprint");
    updatedContent = updatedContent.replace(/90-Tage-Plattform/g, "Therapie-Plattform");
    updatedContent = updatedContent.replace(/90-Tage-/g, "Therapie-");
  } else {
    updatedContent = updatedContent.replace(/90-day plan/g, "continuous therapy plan");
    updatedContent = updatedContent.replace(/90-Day Plan/g, "Continuous Therapy Plan");
    updatedContent = updatedContent.replace(/90-day journey/g, "continuous therapeutic journey");
    updatedContent = updatedContent.replace(/90-day progress/g, "therapy progress");
    updatedContent = updatedContent.replace(/90-day protocol/g, "continuous protocol");
    updatedContent = updatedContent.replace(/90-day course/g, "therapy course");
    updatedContent = updatedContent.replace(/90-day adherence/g, "therapy adherence");
    updatedContent = updatedContent.replace(/90-day therapy plan/g, "continuous therapy plan");
    updatedContent = updatedContent.replace(/a rigid 90-day sprint/g, "a rigid short-term sprint");
    updatedContent = updatedContent.replace(/90-day/g, "long-term");
  }

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Updated ${file}`);
});
