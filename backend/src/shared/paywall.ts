/**
 * Paywall bypass for pilot / test / demo accounts.
 *
 * The portal blocks partners without an active subscription and patients without
 * `hasActiveSubscription`. During pilots we run individual agreements (flat-rate
 * partners, free trials for a GP) that don't go through Stripe, so we need a way
 * to grant access without forcing a plan purchase.
 *
 * Two levers, both env-driven (no DB write, instant, reversible):
 *
 *   DISABLE_PAYWALL=true
 *       Everyone bypasses the paywall. Use only for a fully internal demo build.
 *
 *   PAYWALL_BYPASS_EMAILS=a@x.de, b@y.de
 *       Only these specific accounts bypass the paywall. Preferred for pilots —
 *       real prospects still see billing, your test partners don't.
 *
 * Matching is case-insensitive and trims whitespace.
 */
let cachedList: Set<string> | null = null;
let cachedRaw: string | undefined;

function bypassList(): Set<string> {
  const raw = process.env.PAYWALL_BYPASS_EMAILS;
  if (raw !== cachedRaw || cachedList === null) {
    cachedRaw = raw;
    cachedList = new Set(
      (raw ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }
  return cachedList;
}

let cachedOtpList: Set<string> | null = null;
let cachedOtpRaw: string | undefined;

function otpBypassList(): Set<string> {
  const raw = process.env.OTP_BYPASS_EMAILS;
  if (raw !== cachedOtpRaw || cachedOtpList === null) {
    cachedOtpRaw = raw;
    cachedOtpList = new Set(
      (raw ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }
  return cachedOtpList;
}

/** True when the whole paywall is switched off for this environment. */
export function isPaywallDisabled(): boolean {
  return process.env.DISABLE_PAYWALL === 'true';
}

/** True when this email should bypass the paywall (global switch or allowlist). */
export function isPaywallBypassed(email?: string | null): boolean {
  if (isPaywallDisabled()) return true;
  if (!email) return false;
  return bypassList().has(email.toLowerCase());
}

/** True when this email should bypass OTP verification. */
export function isOtpBypassed(email?: string | null): boolean {
  if (!email) return false;
  return otpBypassList().has(email.toLowerCase());
}
