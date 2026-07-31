/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const cancellationTemplate = {
  title: "Cancellation Policy",
  lastUpdated: "Last Updated: August 2026",
  s1Title: "Right of Withdrawal for Businesses (B2B)",
  s1Text: "Since the Cannathera platform is intended exclusively for commercial users (doctors, medical professionals, telemedicine practitioners, and pharmacies) in the course of their professional or commercial activities, there is no statutory right of withdrawal pursuant to Section 355 of the German Civil Code (BGB).",
  s2Title: "Termination and Cancellation of Subscriptions",
  s2Text: "(1) Contracts and subscriptions may be terminated with four weeks' notice to the end of the respective contract term, subject to any differing individual agreements (e.g., during a pilot phase).\n(2) The right to extraordinary termination for good cause remains unaffected for both parties at any time.\n(3) Any termination must be in writing (e.g., by email to support) to be effective."
};

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  data.cancellation = cancellationTemplate;

  // We should also remove the "text" key if it was present
  if (data.cancellation.text) {
    delete data.cancellation.text;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
}

