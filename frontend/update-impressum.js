/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'messages');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(directoryPath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Address replacements
  content = content.replace(/\[Straße und Hausnummer\]\\n\[PLZ und Ort\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[Street and number\]\\n\[Postcode and city\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[Ulica i numer\]\\n\[Kod pocztowy i miasto\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[Strada și numărul\]\\n\[Cod poștal și oraș\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[Sokak ve numara\]\\n\[Posta kodu ve şehir\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[Улица и номер\]\\n\[Пощенски код и град\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  content = content.replace(/\[الشارع ورقم المبنى\]\\n\[الرمز البريدي والمدينة\]/g, 'Hügelstr. 1\\n46117 Oberhausen');
  
  // Also any stray individual ones
  content = content.replace(/\[Straße und Hausnummer\]/g, 'Hügelstr. 1');
  content = content.replace(/\[PLZ und Ort\]/g, '46117 Oberhausen');

  // Contact replacements
  content = content.replace(/\[kontakt@cannathera\.de\]/g, 'd.larkin@cannathera-report.de');
  content = content.replace(/kontakt@cannathera\.de/g, 'd.larkin@cannathera-report.de');
  content = content.replace(/\[\+49 \.\.\.\]/g, '015568425924');

  // Privacy Policy single line address replacements
  content = content.replace(/\[Anschrift\]/g, 'Hügelstr. 1, 46117 Oberhausen');
  content = content.replace(/\[address\]/g, 'Hügelstr. 1, 46117 Oberhausen');
  content = content.replace(/\[adres\]/g, 'Hügelstr. 1, 46117 Oberhausen');
  content = content.replace(/\[adresă\]/g, 'Hügelstr. 1, 46117 Oberhausen');
  content = content.replace(/\[адрес\]/g, 'Hügelstr. 1, 46117 Oberhausen');
  content = content.replace(/\[العنوان\]/g, 'Hügelstr. 1, 46117 Oberhausen');

  // Privacy Policy email replacements
  content = content.replace(/\[datenschutz@cannathera\.de\]/g, 'd.larkin@cannathera-report.de');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}

