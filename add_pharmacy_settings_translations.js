const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'messages');

const newTranslations = {
  en: {
    settings: {
      title: "Pharmacy Settings",
      subtitle: "Manage your pharmacy's master data, location, and product focus.",
      masterData: "Master Data",
      name: "Pharmacy Name",
      street: "Street Address",
      postalCode: "Postal Code",
      city: "City",
      productFocus: "Product Focus & Specializations",
      productFocusHint: "Briefly describe your focus (e.g. extracts, specific strains, consultation). This will be shown to patients.",
      save: "Save Changes",
      savedSuccess: "Settings saved successfully."
    },
    navSettings: "Settings"
  },
  de: {
    settings: {
      title: "Apotheken-Einstellungen",
      subtitle: "Verwalten Sie die Stammdaten, den Standort und den Produktschwerpunkt Ihrer Apotheke.",
      masterData: "Stammdaten",
      name: "Name der Apotheke",
      street: "Straße & Hausnummer",
      postalCode: "Postleitzahl",
      city: "Ort",
      productFocus: "Produktschwerpunkt & Spezialisierungen",
      productFocusHint: "Beschreiben Sie kurz Ihren Schwerpunkt (z.B. Extrakte, bestimmte Blüten, Beratung). Dies wird Patienten angezeigt.",
      save: "Änderungen speichern",
      savedSuccess: "Einstellungen erfolgreich gespeichert."
    },
    navSettings: "Einstellungen"
  }
};

const defaultTrans = newTranslations.en;

fs.readdirSync(localesDir).forEach((file) => {
  if (!file.endsWith('.json')) return;
  const lang = file.split('.')[0];
  const filepath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  if (!data.pharmacy) data.pharmacy = {};
  
  // Add pharmacy.settings
  const trans = newTranslations[lang] || defaultTrans;
  data.pharmacy.settings = { ...(data.pharmacy.settings || {}), ...trans.settings };
  
  // Add pharmacy.shell.nav.settings
  if (!data.pharmacy.shell) data.pharmacy.shell = {};
  if (!data.pharmacy.shell.nav) data.pharmacy.shell.nav = {};
  data.pharmacy.shell.nav.settings = trans.navSettings;

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${file}`);
});
