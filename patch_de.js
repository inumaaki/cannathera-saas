const fs = require('fs');

const dePath = 'frontend/messages/de.json';
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// Physicians
deData.physicians.f1_title = "Integriertes lokales Apotheken-Routing";
deData.physicians.f1_text = "Kein Raten mehr, wohin Rezepte gehen. Leiten Sie E-Rezepte direkt an die bevorzugte lokale Apotheke des Patienten im Umkreis von 30 km weiter, um eine zuverlässige und schnelle Einlösung zu gewährleisten.";
deData.physicians.f2_title = "Automatisierte Fortschritts- & Ergebnisverfolgung";
deData.physicians.f2_text = "Erhalten Sie strukturierte Fortschrittsberichte, die den genauen Symptomverlauf, validierte Schmerzskalen und die Alltagstoleranz in direkter Verbindung zu spezifischen Cannabis-Sorten unseres Partnernetzwerks darstellen.";
deData.physicians.f4_title = "Schnellere Folgerezepte";
deData.physicians.f4_text = "Wir beseitigen die Reibungsverluste bei Nachsorge und Folgerezepten. Cannathera übernimmt automatisch die Aktualisierung des Rezeptstatus und die rechtssichere Dokumentation, was den administrativen Aufwand Ihrer Praxis drastisch reduziert.";

// Pharmacies
deData.pharmacies.hero_title = "Das Betriebssystem für Cannabis-Apotheken";
deData.pharmacies.hero_intro = "Cannathera verbindet lokale Cannabis-Apotheken mit Patienten und verschreibenden Ärzten durch striktes, lokales 30km-Routing. Mit unserer strikten 'No Scraping'-Regel werden Sie zu einem exklusiven, verifizierten Partner – und sichern sich einen loyalen Patientenstamm, anstatt nur in einem Verzeichnis gelistet zu sein.";
deData.pharmacies.f1_title = "Hyper-Lokaler Patienten-Funnel";
deData.pharmacies.f1_text = "Werden Sie ein Top-Anbieter in Ihrer Region. Unsere 30km-Umkreissuche und die 'Favoriten-Pool'-Logik garantieren, dass lokale Patienten direkt an Ihre Apotheke weitergeleitet werden.";
deData.pharmacies.f2_title = "Rezept-Eingang & CRM-Dashboard";
deData.pharmacies.f2_text = "Verwalten Sie Ihren gesamten medizinischen Cannabis-Workflow auf einem Bildschirm. Empfangen Sie Rezepte, aktualisieren Sie Status (Eingegangen, In Vorbereitung, Abholbereit, Abgeschlossen) und kommunizieren Sie sicher mit Patienten und Ärzten.";
deData.pharmacies.f3_title = "Kein Scraping. Echte Partnerschaften.";
deData.pharmacies.f3_text = "Im Gegensatz zu Verzeichnis-Scrapern baut Cannathera aktive, verifizierte Partnerschaften auf. Wir listen Sie nicht nur; wir stellen das Betriebssystem zur Verfügung, um Ihr Cannabis-Inventar und Patientenbestellungen sicher zu verwalten.";
deData.pharmacies.f4_title = "Optimierte E-Rezept-Verarbeitung";
deData.pharmacies.f4_text = "Eliminieren Sie manuelle Dateneingabe. Erhalten Sie validierte, konforme E-Rezepte direkt aus der Arztpraxis, vollständig mit der erforderlichen medizinischen Dokumentation und Dosierungsanweisungen.";

// Telemedicine
deData.telemedicine.v2_hero_title = "Enterprise-Telemedizin, angetrieben von lokaler Versorgung";
deData.telemedicine.v2_hero_intro = "Skalieren Sie Ihre Telemedizin-Klinik mit den strukturierten Workflows von Cannathera. Durch die Vorfilterung von Patienten-Feedback und die Digitalisierung der Therapiebegleitung sehen Ärzte nur die klinischen Signale, die sie benötigen – weniger Hintergrundrauschen, mehr Zeit für Patienten.";
deData.telemedicine.v2_f1_title = "API-Integration auf Enterprise-Niveau";
deData.telemedicine.v2_f1_text = "Verbinden Sie Ihre bestehende Praxissoftware direkt mit dem lokalen Apothekennetzwerk von Cannathera. Automatisieren Sie das Rezept-Routing im großen Maßstab.";

fs.writeFileSync(dePath, JSON.stringify(deData, null, 2) + '\n', 'utf8');
console.log("Updated de.json with translated marketing copy.");
