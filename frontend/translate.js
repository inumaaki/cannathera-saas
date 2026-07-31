/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { translate } = require('bing-translate-api');

const locales = [
  { code: 'uk', from: 'en', to: 'uk' },
  { code: 'ary', from: 'en', to: 'ar' },
  { code: 'ru', from: 'en', to: 'ru' },
  { code: 'pl', from: 'en', to: 'pl' },
  { code: 'ro', from: 'en', to: 'ro' }
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  const sourcePath = path.join(__dirname, 'messages', 'en.json');
  const enData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

  // Flatten the object to extract strings
  const paths = [];
  const strings = [];

  function traverse(obj, currentPath) {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      if (typeof val === 'string') {
        paths.push(newPath);
        strings.push(val);
      } else if (typeof val === 'object' && val !== null) {
        traverse(val, newPath);
      }
    }
  }

  traverse(enData, '');
  console.log(`Found ${strings.length} strings to translate.`);

  // Function to protect ICU variables
  const placeholdersMap = []; // Array of arrays of placeholders
  const protectedStrings = strings.map((str, idx) => {
    let temp = str;
    const p = [];
    temp = temp.replace(/(\{[^}]+\}|<[^>]+>)/g, (match) => {
      p.push(match);
      return `[PH${p.length - 1}]`;
    });
    placeholdersMap[idx] = p;
    return temp;
  });

  for (const locale of locales) {
    console.log(`\nTranslating for ${locale.code}...`);
    const translatedStrings = [];
    
    // Batch into chunks of ~1500 chars to avoid limits
    let currentChunk = [];
    let currentLength = 0;
    const batches = [];
    
    for (let i = 0; i < protectedStrings.length; i++) {
      const s = protectedStrings[i];
      if (currentLength + s.length > 1500 && currentChunk.length > 0) {
        batches.push(currentChunk);
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push({ idx: i, text: s });
      currentLength += s.length + 5; // 5 for delimiter
    }
    if (currentChunk.length > 0) batches.push(currentChunk);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const textToTranslate = batch.map(b => b.text).join(' ||| ');
      
      try {
        const res = await translate(textToTranslate, null, locale.to, true);
        const translatedParts = res.translation.split(/\s*\|\|\|\s*/);
        
        for (let j = 0; j < batch.length; j++) {
          const originalIdx = batch[j].idx;
          let translatedText = translatedParts[j] || batch[j].text;
          
          // Restore placeholders
          const p = placeholdersMap[originalIdx];
          translatedText = translatedText.replace(/\[\s*PH\s*(\d+)\s*\]/ig, (match, p1) => {
            return p[parseInt(p1, 10)] || match;
          });
          
          translatedStrings[originalIdx] = translatedText;
        }
        
        process.stdout.write(`\rProgress: ${Math.round((i + 1) / batches.length * 100)}%`);
        await sleep(150); // slight delay to prevent rate limit
      } catch (err) {
        console.error(`\nBatch ${i} failed. Using fallback. Error: ${err.message}`);
        for (let j = 0; j < batch.length; j++) {
           translatedStrings[batch[j].idx] = batch[j].text.replace(/\[PH(\d+)\]/g, (m, p1) => placeholdersMap[batch[j].idx][p1]);
        }
        await sleep(500);
      }
    }
    console.log(`\nReconstructing ${locale.code}.json...`);

    // Reconstruct
    const resultObj = {};
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i].split('.');
      let current = resultObj;
      for (let j = 0; j < p.length - 1; j++) {
        if (!current[p[j]]) current[p[j]] = {};
        current = current[p[j]];
      }
      current[p[p.length - 1]] = translatedStrings[i];
    }
    
    // Also include any original structure if there are empty arrays etc.
    const destPath = path.join(__dirname, 'messages', `${locale.code}.json`);
    fs.writeFileSync(destPath, JSON.stringify(resultObj, null, 2));
    console.log(`Finished ${locale.code}.`);
  }
}

main().catch(console.error);

