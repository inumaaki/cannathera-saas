const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'frontend/messages');
const enPath = path.join(messagesDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Deep merge function
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  try {
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // We only want to ensure the keys we touched are present. 
    // The easiest way to ensure no missing keys is to deep merge the EN data 
    // into the target data. This means any missing keys in the target get the EN value.
    // However, since we rewrote existing EN keys for physicians, pharmacies, etc.,
    // we want to overwrite the old localized strings with the new EN strings for these specific sections,
    // otherwise the old localized strings (e.g. "Mail order pharmacy") will still show up.
    
    // So we will explicitly overwrite these sections with the EN version for now.
    data.landing = deepMerge(data.landing || {}, enData.landing);
    data.physicians = deepMerge(data.physicians || {}, enData.physicians);
    data.pharmacies = deepMerge(data.pharmacies || {}, enData.pharmacies);
    data.telemedicine = deepMerge(data.telemedicine || {}, enData.telemedicine);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Synced ${file}`);
  } catch (err) {
    console.error(`Error syncing ${file}:`, err);
  }
}

console.log("All languages synced with updated English keys.");
