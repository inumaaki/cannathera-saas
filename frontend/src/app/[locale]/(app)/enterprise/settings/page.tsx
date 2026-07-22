import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { SecurityPolicyForm } from "@/components/enterprise/SecurityPolicyForm";

type Settings = {
  security: { mandatory2fa: boolean; sessionTimeoutMin: number };
  system: {
    apiStatus: string;
    passwordHashing: string;
    transport: string;
    storedReports: number;
    auditEntries: number;
  };
};

type Audit = {
  rows: Array<{
    id: string;
    user: string;
    action: string;
    entityType: string | null;
    createdAt: string;
  }>;
  total: number;
};

/* Actions that touch health data or security are highlighted in the log. */
const HOT = /EXPORT|DELETE|REVOKE|SECURITY|FAILED|REMOVED/;

/* Figma 8.8 — Organization Settings. */
export default async function EnterpriseSettings({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, d, audit] = await Promise.all([
    getTranslations("enterprise.settings"),
    getFormatter(),
    apiServer<Settings>("/enterprise/settings"),
    apiServer<Audit>("/enterprise/settings/audit?limit=12"),
  ]);

  return (
    <>
      <div>
        <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[5fr_7fr]">
        <SecurityPolicyForm
          initial={
            d?.security ?? { mandatory2fa: true, sessionTimeoutMin: 30 }
          }
        />

        {/* System audit log */}
        <section className="cw-watermark self-start overflow-hidden rounded-xl border border-hairline bg-white">
          <h2 className="flex items-center gap-2 border-b border-hairline px-6 py-4 font-display text-lg font-bold text-pine">
            <span aria-hidden className="msym text-[22px] text-pine-600">
              receipt_long
            </span>
            {t("auditTitle")}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colUser")}</th>
                  <th className="px-6 py-3 text-start">{t("colAction")}</th>
                  <th className="px-6 py-3 text-start">{t("colTime")}</th>
                </tr>
              </thead>
              <tbody>
                {(audit?.rows ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mint/40 text-[10px] font-bold text-pine">
                          {a.user.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate text-xs text-ink-strong">{a.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${
                          HOT.test(a.action) ? "text-accent-print" : "text-info"
                        }`}
                      >
                        {a.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-muted">
                      {format.dateTime(new Date(a.createdAt), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border-t border-hairline px-6 py-3 text-xs text-muted">
            {t("auditShowing", {
              count: audit?.rows.length ?? 0,
              total: audit?.total ?? 0,
            })}
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint/30 text-[24px] text-pine-600">
            <span aria-hidden className="msym">api</span>
          </span>
          <h2 className="mt-3 font-display text-lg font-bold text-pine">
            {t("apiStatus")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("apiStatusNote")}</p>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-pine-600">
            <span aria-hidden className="size-2 rounded-full bg-current" />
            {t("operational")}
          </p>
        </div>

        <div className="cw-watermark rounded-xl border border-hairline bg-white p-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#eef2fe] text-[24px] text-info">
            <span aria-hidden className="msym">lock</span>
          </span>
          <h2 className="mt-3 font-display text-lg font-bold text-pine">
            {t("storage")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("storageNote", { count: d?.system.storedReports ?? 0 })}
          </p>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted">{t("hashing")}</dt>
              <dd className="font-mono font-bold text-ink-strong">
                {d?.system.passwordHashing}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t("transport")}</dt>
              <dd className="font-mono font-bold text-ink-strong">
                {d?.system.transport}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl bg-brand p-6 text-center text-white">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/15 text-[24px] text-mint-bright">
            <span aria-hidden className="msym">support_agent</span>
          </span>
          <h2 className="mt-3 font-display text-lg font-bold">{t("supportTitle")}</h2>
          <p className="mt-1 text-sm text-white/80">{t("supportNote")}</p>
          <a
            href="mailto:support@cannathera.de"
            className="mt-4 block rounded-lg bg-mint-bright px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-pine hover:bg-mint"
          >
            {t("contactManager")}
          </a>
        </div>
      </div>
    </>
  );
}
