const fs = require('fs');

const enPath = 'frontend/messages/en.json';
const dePath = 'frontend/messages/de.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const deData = JSON.parse(fs.readFileSync(dePath, 'utf8'));

// ===== PHYSICIANS =====
enData.physicians.f1_title = "Integrated Local Pharmacy Routing";
enData.physicians.f1_text = "No more guessing where prescriptions go. Route E-Prescriptions directly to a patient's favorite local pharmacy within a 30km radius, ensuring reliable and fast fulfillment.";

enData.physicians.f2_title = "Automated Progress & Outcomes Tracking";
enData.physicians.f2_text = "Receive structured progress reports that depict the precise course of symptoms, validated pain scales, and everyday tolerability directly linked to specific cannabis strains dispensed by our partner network.";

enData.physicians.f4_title = "Focus on Patient Care, Not Logistics";
enData.physicians.f4_text = "We eliminate the friction of coordinating with dispensaries. Cannathera's CRM handles the prescription status updates and logistics in the background, relieving your practice of administrative overhead.";

// ===== PHARMACIES =====
enData.pharmacies.f1_title = "Hyper-Local Patient Funnel";
enData.pharmacies.f1_text = "Become a top-tier provider in your region. Our 30km radius search and 'Favorites Pool' logic guarantees that local patients are routed directly to your pharmacy.";

enData.pharmacies.f2_title = "Prescription Inbox & CRM Dashboard";
enData.pharmacies.f2_text = "Manage your entire medical cannabis workflow from one screen. Receive prescriptions, update statuses (Received, Preparing, Ready, Completed), and communicate securely with patients and prescribing physicians.";

enData.pharmacies.f3_title = "No Scraping. True Partnerships.";
enData.pharmacies.f3_text = "Unlike directory scrapers, Cannathera builds active, verified partnerships. We don't just list you; we provide the operating system to manage your cannabis inventory and patient orders securely.";

enData.pharmacies.f4_title = "Streamlined E-Prescription Processing";
enData.pharmacies.f4_text = "Eliminate manual data entry. Receive validated, compliant E-Prescriptions directly from the physician's practice, complete with required medical documentation and dosage instructions.";

// Telemedicine
enData.telemedicine.v2_f1_title = "Enterprise-Grade API Integration";
enData.telemedicine.v2_f1_text = "Connect your existing clinical software directly into Cannathera's local pharmacy network. Automate prescription routing at scale.";

// Sync DE to EN for these keys (translating roughly, but keeping it simple for now, using English fallbacks for new tech terms if needed)
deData.physicians = { ...deData.physicians, ...enData.physicians };
deData.pharmacies = { ...deData.pharmacies, ...enData.pharmacies };
deData.telemedicine = { ...deData.telemedicine, ...enData.telemedicine };
deData.landing = { ...deData.landing, ...enData.landing };

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(dePath, JSON.stringify(deData, null, 2), 'utf8');

console.log("Deep content reframing applied to en.json and synced to de.json.");
