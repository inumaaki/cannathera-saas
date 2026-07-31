import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { API_URL } from "@/lib/api";
import { ReportButtons } from "@/components/reports/ReportButtons";

type ReportRow = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  fileUrl: string | null;
  generatedAt: string | null;
};

const TYPE_KEY: Record<string, "monthly" | "quarterly" | "yearly" | "longTerm"> = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
  LONG_TERM: "longTerm",
};

/* Patient's own PDF reports — incl. the >90-day long-term export. */
export default async function PatientReports({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, history] = await Promise.all([
    getTranslations("patient.reports"),
    getFormatter(),
    apiServer<ReportRow[]>("/documents/mine/history"),
  ]);

  const labels = {
    MONTHLY: t("monthly"),
    QUARTERLY: t("quarterly"),
    YEARLY: t("yearly"),
    LONG_TERM: t("longTerm"),
    generating: t("generating"),
  };

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
      <p className="mt-1 text-muted">{t("subtitle")}</p>

      <section className="cw-watermark mt-5 rounded-2xl border border-hairline bg-white p-5">
        <ReportButtons labels={labels} />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-hairline bg-white">
        <h2 className="border-b border-hairline px-5 py-3 font-bold text-ink-strong">
          {t("history")}
        </h2>
        {(history?.length ?? 0) === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted">{t("noHistory")}</p>
        ) : (
          history!.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-bold text-ink-strong">{t(TYPE_KEY[r.type] ?? "monthly")}</p>
                <p className="text-xs text-muted">
                  {format.dateTime(new Date(r.periodStart), {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  –{" "}
                  {format.dateTime(new Date(r.periodEnd), {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              {r.fileUrl ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/documents/file/${r.id}`, { credentials: 'include' });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        if (res.status === 403 && data.message === "UPGRADE_REQUIRED") {
                           window.location.href = "/patient/plan";
                           return;
                        }
                        throw new Error("Download failed");
                      }
                      const blob = await res.blob();
                      const href = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = href;
                      a.download = `cannathera-report.pdf`;
                      a.click();
                      URL.revokeObjectURL(href);
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : String(err);
                      alert("Network error: " + msg);
                    }
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-pine-600 px-3 py-2 text-xs font-bold text-pine-600 hover:bg-mint/20"
                >
                  <span aria-hidden className="msym text-[16px]">
                    download
                  </span>
                  {t("download")}
                </button>
              ) : null}
            </div>
          ))
        )}
      </section>
    </>
  );
}
