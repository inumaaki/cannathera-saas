const fs = require('fs');

const path = 'frontend/messages/en.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Homepage / Landing Hero
data.landing.hero.title = "Your Therapy.\nMeticulously Structured.";
data.landing.hero.v2_subtitle = "Cannathera is the ultimate CRM and operating system for cannabis pharmacies. We bridge the gap between patients, doctors, and local pharmacies. Our platform empowers regional care through an active partner network, automating documentation and ensuring compliant, structured therapy from day one.";

// Physicians Page
data.physicians.hero_title = "Modern Care Needs a Strong Network";
data.physicians.hero_intro = "Cannathera connects your practice with local pharmacies and patients through a secure, structured medical-cannabis therapy network. Ensure compliance, track patient outcomes, and route prescriptions seamlessly.";

// Pharmacies Page
data.pharmacies.hero_title = "The Operating System for Cannabis Pharmacies";
data.pharmacies.hero_intro = "Stop relying on anonymous directories. Cannathera is built to empower local pharmacists. Our CRM brings you hyper-local patient traffic through a 30km radius search and a dedicated favorites pool, integrating directly with your daily workflow.";

// Telemedicine Page
data.telemedicine.v2_hero_title = "Enterprise Telemedicine, Powered by Local Fulfillment";
data.telemedicine.v2_hero_intro = "Scale your telemedicine clinic with Cannathera's structured workflows and local pharmacy fulfillment network. We provide the CRM infrastructure you need to manage cross-sector care efficiently.";

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log("Updated en.json with new reframed content.");
