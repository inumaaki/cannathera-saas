const fs = require('fs');
for (const lang of ['en', 'de']) {
  const path = 'messages/' + lang + '.json';
  if (fs.existsSync(path)) {
    const d = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    // Task 1: Features
    if (d.landing && d.landing.features && d.landing.features.patientBullets) {
      const idx = d.landing.features.patientBullets.findIndex(b => b.includes('90-day') || b.includes('90-Tage'));
      if (idx !== -1) {
        d.landing.features.patientBullets[idx] = lang === 'en' ? 'Ongoing documentation' : 'Kontinuierliche Dokumentation';
      } else {
        d.landing.features.patientBullets[0] = lang === 'en' ? 'Ongoing documentation' : 'Kontinuierliche Dokumentation';
      }
    }

    // Task 2: Founder Philosophy
    if (!d.founder) d.founder = {};
    
    d.founder.philosophy_text_1 = lang === 'en' ? 
      "We do not replace doctors or pharmacists – we create the precise clinical structure that significantly reduces their workload in their daily practice and provides close support to patients. Successful cannabis therapy is not a rigid 90-day sprint, but a continuous, long-term journey that requires maximum data security and complete transparency. While patients manage their treatment independently in everyday life, pharmacies ensure safe supply and dosage determination, and physicians make medical decisions, Cannathera closes the potentially dangerous gaps between doctor's visits." :
      "Wir ersetzen keine Ärzte oder Apotheker – wir schaffen die präzise klinische Struktur, die sie im Praxisalltag spürbar entlastet und Patienten engmaschig begleitet. Eine erfolgreiche Cannabistherapie ist kein starrer 90-Tage-Sprint, sondern ein kontinuierlicher, langfristiger Weg, der höchste Datensicherheit und lückenlose Transparenz erfordert. Während Patienten im Alltag ihre Behandlung eigenverantwortlich steuern, Apotheken die sichere Versorgung und Dosisfindung gewährleisten und Ärzte die medizinischen Entscheidungen treffen, schließt Cannathera die potenziell gefährlichen Lücken zwischen den Arztbesuchen.";
      
    d.founder.philosophy_text_2 = lang === 'en' ?
      "Through sound, practical risk management, validated triage logic, and fully GDPR-compliant, AES-256-encrypted documentation, we ensure that neither doctors nor pharmacies have blind spots. The result is a new dimension of therapy safety: All progress data, pain scales, and tolerability information are available completely, in a structured format, and at a medical level – for maximum treatment quality from day one and throughout the entire, ongoing course of therapy." :
      "Durch fundiertes, praxisnahes Risikomanagement, validierte Triage-Logik und vollständig DSGVO-konforme, AES-256-verschlüsselte Dokumentation stellen wir sicher, dass weder Ärzte noch Apotheken im Blindflug agieren. Das Ergebnis ist eine neue Dimension der Therapiesicherheit: Alle Verlaufsdaten, Schmerzskalen und Verträglichkeitsinformationen liegen lückenlos, strukturiert und auf medizinischem Niveau vor – für maximale Behandlungsqualität vom ersten Tag an und über den gesamten, kontinuierlichen Therapieverlauf hinweg.";

    // Task 3: Founder New Sections
    d.founder.section1_title = lang === 'en' ? "From practice – for practice" : "Aus der Praxis – für die Praxis";
    d.founder.section1_text = lang === 'en' ? "As a certified geriatric nurse with years of experience in outpatient intensive care, I have seen firsthand and in my daily work where conventional documentation fails: A chaotic mess of paperwork, unstructured patient notes, and missing data between quarters jeopardize the success of therapy. Cannathera wasn't developed on the drawing board or out of purely economic interest, but as a direct response to the real problems on the ground. We give doctors and pharmacists back the reliability they need to safely care for their patients." : "Als examinierte Altenpflegerin mit jahrelanger Erfahrung in der außerklinischen Intensivpflege habe ich am eigenen Leib und im täglichen Einsatz gesehen, wo herkömmliche Dokumentation scheitert: Zettelwirtschaft, unstrukturierte Patientennotizen und fehlende Daten zwischen den Quartalen gefährden den Therapieerfolg. Cannathera ist nicht am Reißbrett oder aus rein wirtschaftlichem Interesse entstanden, sondern als direkte Antwort auf die echten Probleme an der Basis. Wir geben Ärzten und Apothekern die Verlässlichkeit zurück, die sie für eine sichere Begleitung ihrer Patienten brauchen.";

    d.founder.section2_title = lang === 'en' ? "A Closed Loop for Maximum Security" : "Ein geschlossener Kreislauf für maximale Sicherheit";
    d.founder.section2_text = lang === 'en' ? "Cannabis therapy only works through the collaborative efforts of the prescribing physician, the dispensing pharmacy, and the patient in their daily life. Where interface issues and information gaps previously hampered the process, Cannathera connects all involved parties via a secure, data protection-compliant architecture. No anonymous algorithms, but clinically sound logic that puts people first." : "Cannabistherapie funktioniert nur im Zusammenspiel zwischen verordnendem Arzt, abgebender Apotheke und dem Patienten im Alltag. Wo bisher Schnittstellenprobleme und Informationslücken den Ablauf hemmten, vernetzt Cannathera alle Beteiligten über eine sichere, datenschutzkonforme Architektur. Keine anonymen Algorithmen, sondern klinisch fundierte Logik, bei der der Mensch im Mittelpunkt steht.";

    // Task 4: Physicians Page Detailed Update
    if (!d.physicians) d.physicians = {};
    d.physicians.hero_title = lang === 'en' ? "Structured progress data, absolute therapy safety, and noticeable relief in everyday practice" : "Strukturierte Verlaufsdaten, absolute Therapiesicherheit und spürbare Entlastung im Praxisalltag";
    d.physicians.hero_intro = lang === 'en' ? "As physicians in private practice, pain therapists, and prescribing specialists, you bear medical responsibility for the treatment of your patients. Especially with cannabinoid therapies, close monitoring and continuous adjustments are crucial for therapeutic success. However, everyday practice is characterized by a lack of time, unstructured patient notes on scraps of paper or in emails, and a lack of valid measurements between quarterly appointments. Cannathera closes this dangerous information gap and provides you with the precise, clinically structured data basis you need for efficient and safe prescribing." : "Als niedergelassene Ärzte, Schmerztherapeuten und verordnende Spezialisten tragen Sie die medizinische Verantwortung für die Behandlung Ihrer Patienten. Gerade bei Cannabinoid-Therapien sind ein engmaschiges Monitoring und kontinuierliche Anpassungen entscheidend für den Therapieerfolg. Der Praxisalltag ist jedoch geprägt von Zeitmangel, unstrukturierten Patientennotizen auf Zetteln oder in E-Mails sowie fehlenden validen Messwerten zwischen den Quartalsterminen. Cannathera schließt diese gefährliche Informationslücke und liefert Ihnen genau die präzise, klinisch strukturierte Datengrundlage, die Sie für eine effiziente und sichere Verordnung benötigen.";
    d.physicians.f1_title = lang === 'en' ? "Complete and physician-friendly progress reports" : "Lückenlose und arztgerechte Verlaufsberichte";
    d.physicians.f1_text = lang === 'en' ? "No more messy notes. With just one click, you receive structured PDF reports that depict the precise course of symptoms, validated pain scales, and everyday tolerability." : "Schluss mit der Zettelwirtschaft. Mit nur einem Klick erhalten Sie strukturierte PDF-Berichte, die den präzisen Symptomverlauf, validierte Schmerzskalen und die Alltagsverträglichkeit abbilden.";
    d.physicians.f2_title = lang === 'en' ? "Automated triage logic & real-time alerts" : "Automatisierte Triage-Logik & Echtzeit-Warnungen";
    d.physicians.f2_text = lang === 'en' ? "Our system monitors defined thresholds in the background. In the event of unexpected side effects or deviations from the prescribed therapy, our validated triage logic kicks in, ensuring you are alerted promptly and in compliance with legal requirements." : "Unser System überwacht definierte Schwellenwerte im Hintergrund. Bei unerwarteten Nebenwirkungen oder Abweichungen von der verordneten Therapie greift unsere validierte Triage-Logik und stellt sicher, dass Sie rechtzeitig und rechtssicher alarmiert werden.";
    d.physicians.f3_title = lang === 'en' ? "Maximum data security & compliance" : "Höchste Datensicherheit & Compliance";
    d.physicians.f3_text = lang === 'en' ? "The platform meets the strictest legal requirements. It operates in full GDPR compliance, uses secure AES-256 encryption, and is based on its status as a certified Class I medical device." : "Die Plattform erfüllt höchste gesetzliche Anforderungen. Sie arbeitet vollständig DSGVO-konform, nutzt eine sichere AES-256-Verschlüsselung und basiert auf dem Status als zertifiziertes Medizinprodukt der Klasse I.";
    d.physicians.f4_title = lang === 'en' ? "Focus on what matters" : "Fokus auf das Wesentliche";
    d.physicians.f4_text = lang === 'en' ? "We do not replace medical diagnosis or treatment decisions. Instead, we create the organizational structure that relieves you of administrative burdens and allows you to fully concentrate on patient care." : "Wir ersetzen keine medizinische Diagnose oder Behandlungsentscheidung. Vielmehr schaffen wir die organisatorische Struktur, die Sie von administrativen Hürden befreit und Ihnen ermöglicht, sich voll und ganz auf die Patientenbetreuung zu konzentrieren.";

    // Task 5: Pharmacies Update (Prompt text)
    if (!d.pharmacies) d.pharmacies = {};
    d.pharmacies.val_title = lang === 'en' ? "Added value for pharmacies" : "Mehrwert für Apotheken";
    d.pharmacies.val_text = lang === 'en' ? "Transparency in strain selection, support for patients in determining the correct dosage, and documentation of side effects as part of ongoing support." : "Transparenz bei der Sortenauswahl, Unterstützung der Patienten bei der Findung der richtigen Dosierung und Dokumentation von Nebenwirkungen im Rahmen der kontinuierlichen Begleitung.";
    d.pharmacies.comm_title = lang === 'en' ? "Streamlined process & Communication" : "Geführter Prozess & Kommunikation";
    d.pharmacies.comm_text = lang === 'en' ? "How the platform supports communication and a streamlined process between the patient, prescribing practice, and dispensing pharmacy." : "Wie die Plattform die Kommunikation und einen reibungslosen Ablauf zwischen Patient, verordnender Praxis und abgebender Apotheke unterstützt.";
    d.pharmacies.qual_title = lang === 'en' ? "Professional qualifications" : "Fachliche Qualifikationen";
    d.pharmacies.qual_text = lang === 'en' ? "Information on professional qualifications (practical background and certified consultation) and how pharmacies can be involved as partners or points of contact." : "Informationen zu fachlichen Qualifikationen (praktischer Hintergrund und zertifizierte Beratung) und wie sich Apotheken als Partner oder Ansprechpartner einbringen können.";

    fs.writeFileSync(path, JSON.stringify(d, null, 2));
  }
}
