/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
for (const lang of ['en', 'de']) {
  const path = 'messages/' + lang + '.json';
  if (fs.existsSync(path)) {
    const d = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    if (d.founder) {
      if (!d.landing) d.landing = {};
      if (!d.landing.founder) d.landing.founder = {};
      
      d.landing.founder.philosophy_text_1 = d.founder.philosophy_text_1;
      d.landing.founder.philosophy_text_2 = d.founder.philosophy_text_2;
      d.landing.founder.section1_title = d.founder.section1_title;
      d.landing.founder.section1_text = d.founder.section1_text;
      d.landing.founder.section2_title = d.founder.section2_title;
      d.landing.founder.section2_text = d.founder.section2_text;
      
      delete d.founder;
      fs.writeFileSync(path, JSON.stringify(d, null, 2));
    }
  }
}

