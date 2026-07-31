# Cannathera SaaS - Comprehensive System Blueprint

This document contains **everything** needed to understand, replicate, and maintain the Cannathera Medical SaaS platform from scratch. It is designed to be exhaustive enough that any Developer or AI Agent can recreate the entire system architecture, database, and logic exactly as it is built today.

---

## 1. Architecture Overview
Cannathera is a B2B2C medical SaaS platform for cannabis therapy tracking. 
The system enforces strict multi-tenancy and Role-Based Access Control (RBAC).

### Key Entities
- **Patients**: End-users who undergo therapy. They belong to a `Practice` (their doctor) and a `Pharmacy` (for dispensing and reviews).
- **Doctors**: Medical professionals working within a `Practice`.
- **Pharmacies**: Dispense medicine and conduct "Monthly Reviews" (`Monatsreview`).
- **Enterprises**: Umbrella organizations that own/manage multiple Practices and Pharmacies.
- **Admins**: Superusers managing the Cannathera platform itself.

### Technical Stack
- **Frontend**: Next.js 16 (App Router) + React + Tailwind CSS + `next-intl` (i18n).
- **Backend**: NestJS 11 + Prisma ORM + PostgreSQL.
- **Authentication**: Custom JWT HttpOnly cookies (`cannathera_session` and `cannathera_preauth`).
- **Billing**: Stripe (Checkout Sessions, Webhooks, Customer Portal).
- **Real-Time**: Server-Sent Events (SSE) via NestJS `@Sse()` for instant notifications.

---

## 2. Directory Structure & Workflows

### Frontend (`/frontend`)
The frontend is a standard Next.js App Router project utilizing dynamic locale routing.
- **`src/app/[locale]/layout.tsx`**: Sets up `next-intl` messages and global HTML.
- **`src/app/[locale]/(auth)`**: Contains login, signup, and 2-step OTP verification logic.
- **`src/app/[locale]/(app)`**: Contains dashboard sub-routes:
  - `/admin`: Metrics, Organization Approvals, Partner Codes.
  - `/doctor`: Patient lists, Red Flag alerts, Telemedicine.
  - `/patient`: Therapy logging, Onboarding, Subscription Paywall.
- **State & Fetching**: Direct `fetch` calls wrapped in `api()` (client-side) and `apiServer()` (server-side) inside `/lib`. 

### Backend (`/backend`)
The backend is a highly modular NestJS application.
- **`/auth`**: Handles login, OTP emails (Nodemailer), and JWT signing. Includes `SessionGuard`, `RolesGuard`, and `PermissionsGuard`.
- **`/patient`**: Endpoints for daily `TherapyLog` creation. Triggers "Red Flags" when pain >= 9 or sleep <= 2.
- **`/doctor`**: Endpoints for managing their patient list and viewing historical logs.
- **`/admin`**: Endpoints for global oversight.
- **`/stripe`**: Endpoints to create Stripe checkout sessions and parse Stripe Webhooks.
- **`/notifications`**: Uses `EventEmitter2` to broadcast internal events to SSE streams.

---

## 3. Core Business Logic & Rules

### A. Patient Onboarding & Registration
1. A Patient signs up using an email, password, and a **Partner Code** (e.g. `SMITH2026`).
2. Backend validates the code and links the Patient to the `Organization` that owns the code.
3. The Patient receives a 6-digit OTP via email. They enter it on the `/verify` page.
4. The Patient logs in, but is intercepted by `/patient/onboarding`.
5. They submit their `CompleteOnboardingDto` (Address, Phone, Main Complaints, Baseline Metrics).
6. Next, they are intercepted by the **PaywallModal** (Stripe) and must purchase a subscription.
7. Upon successful payment, Stripe sends a Webhook, the backend marks `hasActiveSubscription = true`, and the dashboard unlocks.

### B. Therapy Logging & Red Flags
1. Patients log daily metrics (Dosage, Strain, Pain 1-10, Sleep 1-10, QoL).
2. If Pain >= 9 or Sleep <= 2, the Backend creates a `RedFlagHit`.
3. The Backend publishes an SSE event to the `orgId` (Doctor) and `pharmacyId` (Pharmacy).
4. Doctors see this alert live on their dashboard and can take clinical action.

---

## 4. Environment Variables

### Backend `.env`
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/cannathera?schema=public"
JWT_SECRET="generate_a_secure_random_string_here"
PORT=4000
FRONTEND_URL="http://localhost:3000"

# Mail Settings (Example: Ionos SMTP)
SMTP_HOST="smtp.ionos.de"
SMTP_PORT=587
SMTP_USER="no-reply@cannathera-report.de"
SMTP_PASS="password"
SMTP_FROM="no-reply@cannathera-report.de"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## 5. Exact Package Dependencies

### Frontend `package.json`
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "bing-translate-api": "^4.2.0",
    "material-symbols": "^0.45.6",
    "next": "16.2.10",
    "next-intl": "^4.3.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "server-only": "^0.0.1",
    "swr": "^2.4.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Backend `package.json`
```json
{
  "name": "backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "prisma db push --skip-generate && nest start",
    "dev": "nest start --watch",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "prisma db push --skip-generate && npx tsx prisma/create-admin.ts && node dist/main",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "^6.19.3",
    "argon2": "^0.44.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "cookie-parser": "^1.4.7",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^9.0.3",
    "openai": "^7.0.0",
    "puppeteer": "^25.3.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "stripe": "^22.3.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/cookie-parser": "^1.4.10",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/multer": "^2.2.0",
    "@types/node": "^24.0.0",
    "@types/nodemailer": "^8.0.1",
    "@types/supertest": "^7.0.0",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^17.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "prisma": "^6.19.3",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  },
  "pnpm": {
    "onlyBuiltDependencies": [
      "@prisma/client",
      "@prisma/engines",
      "argon2",
      "prisma",
      "puppeteer"
    ]
  }
}
```

---

## 6. Complete Database Schema (Prisma)

This is the exact source of truth for the entire Cannathera database architecture.

```prisma
// Cannathera — PostgreSQL schema
// Design goals: MODULAR (add questionnaires/forms without code changes),
// MULTILINGUAL (translatable dynamic content), GDPR-auditable.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

enum Role {
  PATIENT
  DOCTOR
  PHARMACY
  ENTERPRISE
  ADMIN
}

enum OrgType {
  PHARMACY
  PRACTICE
  ENTERPRISE
  CLINIC
}

enum Locale {
  de
  en
  tr
  bg
  ar
  uk
  ary
  ru
  pl
  ro
}

enum QuestionType {
  TEXT
  TEXTAREA
  NUMBER
  BOOLEAN
  SINGLE_CHOICE
  MULTI_CHOICE
  SCALE // e.g. NRS 0-10
  DATE
  DOSAGE
}

enum SubmissionStatus {
  DRAFT
  SUBMITTED
  REVIEWED
}

enum RedFlagSeverity {
  INFO
  WARNING
  CRITICAL
}

enum ReportType {
  MONTHLY
  QUARTERLY
  YEARLY
  LONG_TERM
}

enum TeleProvider {
  ZOOM
  TEAMS
  WEBRTC
  OTHER
}

enum SubscriptionTier {
  BASIC
  PLUS
  PREMIUM
  ENTERPRISE
}

// ---------------------------------------------------------------------------
// Identity & organizations
// ---------------------------------------------------------------------------

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(PATIENT)
  firstName     String?
  lastName      String?
  locale        Locale    @default(de)
  isActive      Boolean   @default(true)
  // Set for doctor-created accounts (temp password) — forces password change on first login.
  mustChangePassword Boolean @default(false)
  // Short-lived, encrypted onboarding credential. Cleared as soon as the user sets a password.
  temporaryPasswordEncrypted String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  patientProfile PatientProfile?
  memberships    Membership[]
  consents       Consent[]
  auditLogs      AuditLog[]
  twoFactorCodes TwoFactorCode[]
  passwordResets PasswordResetToken[]
  authoredNotes  ClinicalNote[]

  @@index([role])
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  type      OrgType
  // Co-branding ("Powered by Cannathera" always stays; these override UI look).
  branding  Json? // { logoUrl, primaryColor, accentColor, fontFamily }
  // An ENTERPRISE partner is an umbrella over member pharmacies/practices; the
  // enterprise overview aggregates everything below it.
  parentOrgId String?
  joinedAt    DateTime? // when this org joined the enterprise
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parentOrg        Organization?  @relation("EnterpriseMembers", fields: [parentOrgId], references: [id])
  memberOrgs       Organization[] @relation("EnterpriseMembers")
  memberships      Membership[]
  patients         PatientProfile[] @relation("PracticePatients")
  pharmacyPatients PatientProfile[] @relation("PharmacyPatients")
  subscriptions    Subscription[]
  inventory        InventoryItem[]
  apiKeys          ApiKey[]
  webhooks         WebhookEndpoint[]
  invoices         Invoice[]
  settings         OrgSettings?
  partnerCodes     PartnerCode[]

  @@index([type])
  @@index([parentOrgId])
}

// Links a user (doctor/pharmacy/enterprise staff) to an organization.
model Membership {
  id        String   @id @default(cuid())
  userId    String
  orgId     String
  roleInOrg Role
  // Org-level job title (ADMIN | DOCTOR | ASSISTANT | VIEWER) — presets a
  // permission bundle the admin can then fine-tune per member.
  orgRole     String   @default("DOCTOR")
  permissions String[] @default([])
  createdAt DateTime @default(now())

  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
  @@index([orgId])
}

// Patient-facing referral/partner code that links a new patient registration to an org.
model PartnerCode {
  id         String    @id @default(cuid())
  orgId      String
  code       String    @unique // e.g. "DR-MUELLER-2026" or random 8-char
  label      String?   // friendly description shown in admin
  usageCount Int       @default(0)
  maxUses    Int?      // null = unlimited
  isActive   Boolean   @default(true)
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
  @@index([code])
}

model PatientProfile {
  id           String    @id @default(cuid())
  // A patient is cared for by a PRACTICE (their doctor) and, independently, by a
  // PHARMACY (monthly reviews + dispensing). Both can be set at once.
  orgId        String? // practice
  pharmacyId   String? // pharmacy running the Monatsreview
  userId       String    @unique
  dateOfBirth  DateTime?
  patientRef   String? // human-facing Patienten-ID
  therapyStart DateTime?
  // Pharmacy package (client's Basic/Plus/Premium tiers) + monthly review cycle.
  packageTier  SubscriptionTier @default(BASIC)
  condition    String? // e.g. "Chronische Schmerzen" — shown in the pharmacy roster
  lastReviewAt DateTime?
  
  // Day-1 Onboarding fields
  address      String?
  phone        String?
  mainComplaints String[] @default([])
  complaintsDescription String?
  therapyGoals   String[] @default([])
  baselineMetrics Json?
  onboardingCompleted Boolean @default(false)
  hasActiveSubscription Boolean @default(false)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  org                Organization?        @relation("PracticePatients", fields: [orgId], references: [id])
  pharmacy           Organization?        @relation("PharmacyPatients", fields: [pharmacyId], references: [id])
  submissions        Submission[]
  therapyLogs        TherapyLog[]
  reports            Report[]
  redFlagHits        RedFlagHit[]
  teleSessions       TelemedicineSession[]
  clinicalNotes      ClinicalNote[]

  @@index([orgId])
  @@index([pharmacyId])
}

// ---------------------------------------------------------------------------
// GDPR: consent + audit
// ---------------------------------------------------------------------------

model Consent {
  id         String    @id @default(cuid())
  userId     String
  purpose    String // e.g. "data_processing_art9", "share_with_doctor"
  version    String // consent text version
  granted    Boolean   @default(true)
  grantedAt  DateTime  @default(now())
  revokedAt  DateTime?
  ipAddress  String?
  userAgent  String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, purpose])
}

// Short-lived 6-digit login codes (2FA). Hash only — never store the raw code.
model TwoFactorCode {
  id         String    @id @default(cuid())
  userId     String
  codeHash   String
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}

// One-time password-reset tokens. Hash only, 1h TTL.
model PasswordResetToken {
  id         String    @id @default(cuid())
  userId     String
  tokenHash  String
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String // e.g. "REPORT_EXPORTED", "SUBMISSION_VIEWED"
  entityType String?
  entityId   String?
  metadata   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

// ---------------------------------------------------------------------------
// Modular questionnaire engine (DB-driven, versioned, translatable)
// ---------------------------------------------------------------------------

model Questionnaire {
  id          String   @id @default(cuid())
  key         String   @unique // stable slug e.g. "anamnesis", "monthly_review"
  title       String // canonical German title
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  versions QuestionnaireVersion[]
}

model QuestionnaireVersion {
  id              String   @id @default(cuid())
  questionnaireId String
  version         Int
  isPublished     Boolean  @default(false)
  createdAt       DateTime @default(now())

  questionnaire Questionnaire @relation(fields: [questionnaireId], references: [id], onDelete: Cascade)
  sections      Section[]
  submissions   Submission[]
  redFlagRules  RedFlagRule[]

  @@unique([questionnaireId, version])
}

model Section {
  id        String  @id @default(cuid())
  versionId String
  key       String
  title     String // canonical German
  order     Int     @default(0)

  version   QuestionnaireVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  questions Question[]

  @@index([versionId])
}

model Question {
  id         String       @id @default(cuid())
  sectionId  String
  key        String // stable within questionnaire, used in showIf + answers
  type       QuestionType
  label      String // canonical German
  helpText   String?
  required   Boolean      @default(false)
  order      Int          @default(0)
  config     Json? // type-specific: { min, max, step, unit, ... }
  showIf     Json? // conditional logic: { questionKey, op, value } or boolean tree

  section      Section              @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  options      QuestionOption[]
  translations QuestionTranslation[]
  answers      Answer[]

  @@index([sectionId])
}

model QuestionOption {
  id         String @id @default(cuid())
  questionId String
  value      String
  label      String // canonical German
  order      Int    @default(0)

  question     Question            @relation(fields: [questionId], references: [id], onDelete: Cascade)
  translations OptionTranslation[]

  @@index([questionId])
}

// Per-locale overrides for dynamic content. Missing locale falls back to canonical (de).
model QuestionTranslation {
  id         String @id @default(cuid())
  questionId String
  locale     Locale
  label      String
  helpText   String?

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, locale])
}

model OptionTranslation {
  id       String @id @default(cuid())
  optionId String
  locale   Locale
  label    String

  option QuestionOption @relation(fields: [optionId], references: [id], onDelete: Cascade)

  @@unique([optionId, locale])
}

// ---------------------------------------------------------------------------
// Submissions & answers
// ---------------------------------------------------------------------------

model Submission {
  id        String           @id @default(cuid())
  patientId String
  versionId String
  status    SubmissionStatus @default(DRAFT)
  locale    Locale           @default(de)
  submittedAt DateTime?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  patient     PatientProfile       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  version     QuestionnaireVersion @relation(fields: [versionId], references: [id])
  answers     Answer[]
  redFlagHits RedFlagHit[]

  @@index([patientId])
  @@index([versionId])
}

model Answer {
  id           String @id @default(cuid())
  submissionId String
  questionId   String
  value        Json // flexible: string | number | boolean | string[]

  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  question   Question   @relation(fields: [questionId], references: [id])

  @@unique([submissionId, questionId])
  @@index([submissionId])
}

// ---------------------------------------------------------------------------
// Red-Flag medical warning engine
// ---------------------------------------------------------------------------

model RedFlagRule {
  id          String          @id @default(cuid())
  versionId   String
  key         String
  severity    RedFlagSeverity @default(WARNING)
  condition   Json // { questionKey, op, value } or boolean tree
  message     String // canonical German alert text
  isActive    Boolean         @default(true)

  version QuestionnaireVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  hits    RedFlagHit[]

  @@index([versionId])
}

model RedFlagHit {
  id           String          @id @default(cuid())
  // Optional: hits can also come from daily therapy logs (no submission).
  submissionId String?
  ruleId       String?
  patientId    String
  severity     RedFlagSeverity
  message      String
  source       String          @default("submission") // submission | daily_log
  acknowledged Boolean         @default(false)
  createdAt    DateTime        @default(now())

  submission Submission?    @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  rule       RedFlagRule?   @relation(fields: [ruleId], references: [id])
  patient    PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId])
  @@index([submissionId])
}

// Doctor's clinical notes on a patient.
model ClinicalNote {
  id        String   @id @default(cuid())
  patientId String
  authorId  String
  text      String
  createdAt DateTime @default(now())

  patient PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  author  User           @relation(fields: [authorId], references: [id])

  @@index([patientId, createdAt])
}

// ---------------------------------------------------------------------------
// Therapy tracking + reporting
// ---------------------------------------------------------------------------

model TherapyLog {
  id         String   @id @default(cuid())
  patientId  String
  loggedAt   DateTime
  dosageG    Float? // Blüten dosage in grams
  strain     String? // Sorte
  batchNumber String? // Chargennummer
  manufacturer String? // Hersteller
  consumptionMethod String? // Vaporizer, Inhalation, Oral/Drops, Tea, Joint/Classic
  metrics    Json? // { painNrs, sleepH, activity, qol, satisfaction, sideEffects }
  note       String?
  createdAt  DateTime @default(now())

  patient PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId, loggedAt])
}

model Report {
  id            String     @id @default(cuid())
  patientId     String
  type          ReportType
  periodStart   DateTime
  periodEnd     DateTime
  locale        Locale     @default(de)
  fileUrl       String? // S3 / local path to generated PDF
  poweredByMark Boolean    @default(true)
  coBranded     Boolean    @default(false)
  generatedAt   DateTime?
  createdAt     DateTime   @default(now())

  patient PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId, type])
  @@index([periodStart, periodEnd])
}

// ---------------------------------------------------------------------------
// Telemedicine (provider-abstract)
// ---------------------------------------------------------------------------

model TelemedicineSession {
  id           String       @id @default(cuid())
  patientId    String
  provider     TeleProvider @default(ZOOM)
  externalId   String? // provider meeting id
  joinUrl      String?
  hostUrl      String?
  scheduledAt  DateTime
  durationMin  Int          @default(30)
  createdAt    DateTime     @default(now())

  patient PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([patientId, scheduledAt])
}

// ---------------------------------------------------------------------------
// Enterprise: API access, webhooks, invoices, org policy (Figma 8.x)
// ---------------------------------------------------------------------------

// B2B API key. Only the hash is stored — the plaintext is shown once, at creation.
model ApiKey {
  id         String    @id @default(cuid())
  orgId      String
  name       String
  prefix     String // e.g. "sk_live_" — shown in the UI with the last 4 chars
  last4      String
  keyHash    String
  scopes     String[] // READ | WRITE | ALL_ACCESS
  lastUsedAt DateTime?
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
  @@index([keyHash])
}

// Outbound webhook target (Make.com / Zapier / partner middleware).
model WebhookEndpoint {
  id        String   @id @default(cuid())
  orgId     String
  url       String
  events    String[] // patient.created | report.finalized | alert.triggered | session.updated
  secret    String // HMAC signing secret for the receiver to verify
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org        Organization      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  deliveries WebhookDelivery[]

  @@index([orgId])
}

// One dispatch attempt — powers the "Event Delivery Log" panel.
model WebhookDelivery {
  id          String    @id @default(cuid())
  endpointId  String
  event       String
  payload     Json
  statusCode  Int?
  ok          Boolean   @default(false)
  error       String?
  attempts    Int       @default(1)
  deliveredAt DateTime?
  createdAt   DateTime  @default(now())

  endpoint WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)

  @@index([endpointId, createdAt])
}

model Invoice {
  id        String        @id @default(cuid())
  orgId     String
  number    String        @unique // INV-2026-0941
  periodStart DateTime
  periodEnd   DateTime
  tier      String // Tier 1 | Tier 2 | Tier 3
  reviews   Int // billable monthly reviews in the period
  unitPrice Decimal       @db.Decimal(6, 2)
  amount    Decimal       @db.Decimal(10, 2)
  status    InvoiceStatus @default(PENDING)
  issuedAt  DateTime      @default(now())
  paidAt    DateTime?

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, issuedAt])
}

enum InvoiceStatus {
  PAID
  PENDING
  OVERDUE
}

// Org-level security policy (Figma 8.8 Organization Settings).
model OrgSettings {
  id               String   @id @default(cuid())
  orgId            String   @unique
  mandatory2fa     Boolean  @default(true)
  sessionTimeoutMin Int     @default(30)
  updatedAt        DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
}

// ---------------------------------------------------------------------------
// Subscriptions / pricing (schema now, billing logic later)
// ---------------------------------------------------------------------------

// Pharmacy stock (Figma 6.1.1 Inventory Management).
model InventoryItem {
  id             String   @id @default(cuid())
  orgId          String
  sku            String
  name           String
  category       String // Flower | Oil | Extract | Capsule
  thc            Float?
  cbd            Float?
  stockLevel     Float    @default(0)
  unit           String   @default("g") // g | ml | Stk.
  safetyThreshold Float   @default(50)
  pendingOrder   Boolean  @default(false)
  reorderQty     Float? // quantity of the open purchase order
  orderedAt      DateTime? // when the reorder was placed
  lastRestockAt  DateTime? // when goods were last booked in
  active         Boolean  @default(true) // archived instead of deleted (audit trail)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, sku])
  @@index([orgId])
}

model PricingPlan {
  id            String           @id @default(cuid())
  tier          SubscriptionTier
  name          String
  monthlyPrice  Decimal          @db.Decimal(10, 2)
  reviewCap     Int? // included reviews per month; null = unlimited/tiered
  features      Json?
  isActive      Boolean          @default(true)

  subscriptions Subscription[]
}

model Subscription {
  id        String    @id @default(cuid())
  orgId     String
  planId    String
  startedAt DateTime  @default(now())
  endsAt    DateTime?
  isActive  Boolean   @default(true)

  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  plan PricingPlan  @relation(fields: [planId], references: [id])

  @@index([orgId])
}
```

---

*This document represents the absolute state of the Cannathera SaaS platform. By combining the business logic described above with the exact Prisma schema and dependencies, any intelligent agent or developer can bootstrap this system to functional parity.*
