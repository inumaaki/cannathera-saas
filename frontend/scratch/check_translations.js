const fs = require('fs');
const path = require('path');

const dir = 'd:/Github/cannathera-saas/frontend/messages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const translations = {
  ar: "مريض",
  ary: "مريض",
  bg: "Пациент",
  de: "Patient",
  en: "Patient",
  pl: "Pacjent",
  ro: "Pacient",
  ru: "Пациент",
  tr: "Hasta",
  uk: "Пацієнт"
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  const lang = path.basename(file, '.json');
  
  if (translations[lang]) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.admin && !data.admin.patient) {
        data.admin.patient = translations[lang];
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        console.log(`Added patient to ${lang}`);
      } else {
        console.log(`Patient already exists in ${lang}`);
      }
    } catch (err) {
      console.error(`Error parsing ${lang}: ${err.message}`);
    }
  }
});
