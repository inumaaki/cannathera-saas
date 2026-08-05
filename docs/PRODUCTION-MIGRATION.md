# Cannathera production migration runbook

This runbook deploys the application schema and code safely. It does **not** copy
demo or local patient data into a live clinical database.

## 1. Separate environments

Use separate PostgreSQL databases and deployments for:

- production (real users and real health data), and
- demo/staging (the seeded demonstration accounts).

Do not run `seed*.ts`, `import-live.ts`, `migrate-to-live.ts`, or
`data-export.json` against production. The legacy import scripts are incomplete
for the current schema and are not a production migration mechanism.

## 2. Required production configuration

Backend secrets/settings:

- `NODE_ENV=production`
- `DATABASE_URL` — production PostgreSQL connection, with TLS as required by the provider
- `JWT_SECRET` — a new random value of at least 32 bytes
- `ONBOARDING_CREDENTIAL_SECRET` — a different stable random value
- `WEB_ORIGIN=https://app.example.com` (comma-separated if multiple web origins are intentional)
- `TRUST_PROXY_HOPS=1` for a single managed reverse proxy
- `PORT` — normally injected by the hosting provider
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` if Zoom is enabled
- Stripe keys/webhook secret required by the Stripe service
- `OPENAI_API_KEY` if AI-written summaries are required; reports have a safe deterministic fallback
- `EXPOSE_DEV_AUTH_CODES=false`
- `DISABLE_PAYWALL=false`; leave `PAYWALL_BYPASS_EMAILS` empty for normal billing

Frontend build settings:

- `NEXT_PUBLIC_API_URL=https://api.example.com`
- `NEXT_PUBLIC_EXPOSE_DEV_AUTH_CODES=false`

Both public URLs must use HTTPS. The backend's `WEB_ORIGIN` must exactly include
the frontend origin so credentialed cookies and CORS work.

## 3. Back up and preflight

1. Put the production database into provider backup/PITR protection.
2. Create a fresh snapshot immediately before release.
3. Record the currently deployed commit and database migration status.
4. From `backend`, run `npm ci`, `npm run build`, and `npm run migrate:status`
   using the production `DATABASE_URL`.
5. From `frontend`, run `npm ci` and `npm run build` with production frontend variables.

Never use `prisma migrate dev`, `prisma db push`, or `prisma migrate resolve`
during a normal production release.

## 4. Release order

Run these as distinct deployment phases so a failed migration stops the release:

```bash
cd backend
npm ci
npm run build
npm run migrate:deploy
npm run start:prod
```

Deploy/start the frontend only after the backend migration and health check pass:

```bash
cd frontend
npm ci
npm run build
npm run start
```

For platforms such as Railway/Render, configure `npm run migrate:deploy` as the
release/pre-deploy command and `npm run start:prod` as the runtime command. For
Vercel, set the frontend root to `frontend`; keep the stateful NestJS backend on
an appropriate Node service.

## 5. One-time administrator bootstrap

Run this only in an authenticated maintenance console. It is deliberately not
part of application startup:

```bash
cd backend
ADMIN_EMAIL='admin@example.com' ADMIN_PASSWORD='a-long-random-password' npm run admin:bootstrap
```

An existing admin's password is preserved. To perform an intentional reset,
also set `ADMIN_RESET_PASSWORD=true`, then immediately remove all three temporary
variables from the maintenance session and rotate the password normally.

## 6. Persistent files

Generated report PDFs are stored under `backend/storage/reports`; uploaded logos
are stored under `backend/uploads/public`. Attach encrypted persistent storage
for both paths, or migrate them to encrypted object storage before using
ephemeral/serverless backend instances. Back up report storage consistently with
the database.

## 7. Post-release verification

Verify in this order:

1. `GET https://api.example.com/health` returns `{"status":"ok"}`.
2. Admin login, 2FA/email, logout, and session renewal work.
3. The administrator sees the cross-organization red-flag queue and can acknowledge it.
4. A physician sees no alert navigation, alert counts, warning details, or alert actions.
5. Physician patient roster opens a patient directly and opens the latest monthly review.
6. Physician clinical report list/export and authenticated PDF download work.
7. Enterprise overview totals match partner counts; billing usage and projected billing use the current calendar month.
8. Stripe checkout and a signed webhook work in live mode (use a low-value controlled test).
9. SMTP and Zoom integrations work with production credentials.
10. Restart the backend and confirm logins, database state, PDFs, and logos remain available.

## 8. Rollback

If code smoke tests fail but migrations succeeded, redeploy the previous code
commit first. Prisma migrations are forward-only by default: do not improvise a
down migration. If a migration caused data/schema damage, stop writes and use
the provider snapshot/PITR procedure. Record the failed migration and fix it in
a new reviewed forward migration before another attempt.

## 9. Demo environment only

After schema deployment to the separate demo database, run questionnaire seeds
before the pharmacy demo seed so monthly-review submissions can be generated.
Keep all demonstration credentials out of production and rotate any credentials
that have appeared in source files or chat history.
