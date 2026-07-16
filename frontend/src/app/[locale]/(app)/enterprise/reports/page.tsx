import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Partner = {
  id: string;
  name: string;
  type: "PHARMACY" | "PRACTICE";
  patients: number;
  overdue: number;
  avgAdherence: number;
};

type Overview = {
  patients: number;
  partners: { total: number };
  avgAdherence: number;
  criticalFlags: number;
  topPartners: Partner[];
  months: Array<{ month: string; entries: number; avgQol: number | null }>;
};

/* Figma 8.5 — Cross-Partner Aggregate Reports. */
export default async function EnterpriseReports({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, d] = await Promise.all([
    getTranslations("enterprise.reports"),
    apiServer<Overview>("/enterprise/overview"),
  ]);

  const months = d?.months ?? [];
  const maxEntries = Math.max(1, ...months.map((m) => m.entries));

  // Outcome score: network adherence, benchmarked against the clinical target.
  const score = d?.avgAdherence ?? 0;
  const benchmark = 72;
  const delta = Math.round((score - benchmark) * 10) / 10;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 text-muted">
            {t("subtitle", {
              patients: d?.patients ?? 0,
              partners: d?.partners.total ?? 0,
            })}
          </p>
        </div>
        <a
          href={`${API_URL}/enterprise/export`}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          {t("export")}
        </a>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_4fr]">
        <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-pine">
              {t("trendTitle")}
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-bold text-pine-600">
              <span aria-hidden className="size-2 rounded-full bg-pine-600" />
              {t("activeSeries")}
            </span>
          </div>

          {months.length === 0 ? (
            <p className="py-16 text-center text-muted">{t("empty")}</p>
          ) : (
            /* The bar's percentage height needs a definite height on the row it
               sits in — `h-full` + `justify-end` gives it one. */
            <ul className="mt-6 flex h-64 items-end gap-3">
              {months.map((m) => (
                <li
                  key={m.month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="font-mono text-xs font-bold text-ink-strong">
                    {m.entries}
                  </span>
                  <span
                    className="w-full min-h-1 rounded-t-md bg-mint"
                    style={{ height: `${(m.entries / maxEntries) * 100}%` }}
                    aria-hidden
                  />
                  <span className="text-[10px] font-bold uppercase text-muted">
                    {m.month.slice(5)}/{m.month.slice(2, 4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="self-start rounded-xl bg-brand p-6 text-white">
          <h2 className="font-display text-xl font-bold">{t("outcomeScore")}</h2>
          <div className="mt-6 flex justify-center">
            <ProgressRing
              pct={score}
              size={180}
              stroke={12}
              color="#9ef5be"
              track="rgba(255,255,255,0.18)"
            >
              <p className="font-mono text-4xl font-bold text-white">{score}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-mint">
                {t("benchmark", { value: benchmark })}
              </p>
            </ProgressRing>
          </div>
          <p
            className={`mt-6 flex items-center justify-center gap-1.5 text-sm font-bold ${
              delta >= 0 ? "text-mint-bright" : "text-[#fdece0]"
            }`}
          >
            <span aria-hidden className="msym text-[18px]">
              {delta >= 0 ? "trending_up" : "trending_down"}
            </span>
            {t("vsPrev", { delta: delta >= 0 ? `+${delta}` : delta })}
          </p>
        </section>
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <h2 className="border-b border-hairline px-6 py-4 font-display text-xl font-bold text-pine">
          {t("detailTitle")}
        </h2>

        {(d?.topPartners.length ?? 0) === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colPartner")}</th>
                  <th className="px-6 py-3 text-start">{t("colPatients")}</th>
                  <th className="px-6 py-3 text-start">{t("colAdherence")}</th>
                  <th className="px-6 py-3 text-start">{t("colOverdue")}</th>
                  <th className="px-6 py-3 text-end">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody>
                {d!.topPartners.map((p) => (
                  <tr key={p.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="msym flex size-9 items-center justify-center rounded-lg bg-mint/30 text-[20px] text-pine-600"
                        >
                          {p.type === "PHARMACY" ? "local_pharmacy" : "medical_services"}
                        </span>
                        <span className="font-bold text-ink-strong">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-ink-strong">
                      {p.patients}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-24 rounded-full bg-[#e3e9f2]" aria-hidden>
                          <span
                            className="block h-full rounded-full bg-pine-600"
                            style={{ width: `${p.avgAdherence}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs font-bold text-ink-strong">
                          {p.avgAdherence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                          p.overdue > 0
                            ? "bg-red-50 text-red-600"
                            : "bg-mint/30 text-pine-600"
                        }`}
                      >
                        {p.overdue > 0 ? p.overdue : t("noFlags")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <Link
                        href={`/enterprise/partners/${p.id}`}
                        className="text-xs font-bold text-pine-600 hover:underline"
                      >
                        {t("details")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
