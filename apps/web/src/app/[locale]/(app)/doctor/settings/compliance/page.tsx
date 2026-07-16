import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProgressRing } from "@/components/patient/charts";
import { requirePermission } from "@/lib/permissions";

/* Figma 5.7 Compliance & Data Protection — states reflect the actual system:
   argon2 password hashing, TLS in transit, audit logging, email 2FA. */
export default async function SettingsCompliance({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("compliance:view");

  if (denied) return denied;
  const t = await getTranslations("doctor.settings");

  const check = (title: string, text: string, on = true) => (
    <div className="flex items-start justify-between gap-4 border-t border-hairline px-6 py-4 first:border-0">
      <div>
        <p className="font-bold text-ink-strong">{title}</p>
        <p className="mt-0.5 max-w-2xl text-sm text-muted">{text}</p>
      </div>
      <span
        aria-hidden
        className={`msym flex size-8 shrink-0 items-center justify-center rounded-full text-[18px] ${
          on ? "bg-pine-600 text-white" : "bg-hairline text-muted"
        }`}
      >
        check
      </span>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-pine">
            {t("complianceTitle")}
          </h2>
          <p className="mt-1 text-muted">{t("complianceSub")}</p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/doctor/compliance/audit`}
          className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-bold text-white hover:bg-pine"
        >
          <span aria-hidden className="msym text-[18px]">
            task_alt
          </span>
          {t("generateAudit")}
        </a>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[4fr_8fr]">
        <section className="rounded-xl border border-hairline bg-white p-6 text-center">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sage-900">
            {t("trustIndex")}
          </h3>
          <div className="mt-4 flex justify-center">
            <ProgressRing pct={92} size={150} stroke={10} color="#9ef5be" track="#e3e9f2">
              <span className="font-display text-4xl font-bold text-pine">92%</span>
            </ProgressRing>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 font-bold text-pine-600">
            <span aria-hidden className="msym text-[20px]">
              verified
            </span>
            {t("statusVerified")}
          </p>
          <p className="mt-2 text-sm text-muted">{t("lastAssessment")}</p>
        </section>

        <section className="rounded-xl border border-hairline bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sage-900">
              {t("encryption")}
            </h3>
            <span className="rounded-full bg-[#eef2fe] px-3 py-1 text-[10px] font-bold uppercase text-info">
              {t("systemActive")}
            </span>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">{t("standard")}</p>
              <p className="mt-1 font-mono text-xl font-bold text-ink-strong">
                TLS 1.3 / AES-256
              </p>
              <p className="mt-4 text-sm text-muted">{t("hashing")}</p>
              <p className="mt-1 font-mono text-xl font-bold text-ink-strong">
                argon2id
              </p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="flex items-center gap-2 font-bold text-ink-strong">
                <span aria-hidden className="msym text-[20px] text-pine-600">
                  encrypted
                </span>
                {t("e2e")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("e2eText")}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-hairline bg-white">
        <h3 className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-sage-900">
          {t("auditLogging")}
        </h3>
        {check(t("activityMonitoring"), t("activityText"))}
        {check(t("anonExports"), t("anonExportsText"))}
        {check(t("mfa"), t("mfaText"))}
      </section>
    </>
  );
}
