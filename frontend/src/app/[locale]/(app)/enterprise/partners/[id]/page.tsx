import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";

type Detail = {
  partner: {
    id: string;
    name: string;
    type: "PHARMACY" | "PRACTICE";
    joinedAt: string | null;
    tier: string;
  };
  patients: Array<{
    id: string;
    name: string;
    patientRef: string | null;
    condition: string | null;
    tier: string;
    lastReviewAt: string | null;
    diffDays: number;
    overdue: boolean;
    openFlags: number;
  }>;
};

/* Figma 8.3 — Partner detail. */
export default async function PartnerDetail({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, format, d] = await Promise.all([
    getTranslations("enterprise.partners"),
    getFormatter(),
    apiServer<Detail>(`/enterprise/partners/${encodeURIComponent(id)}`),
  ]);
  if (!d) notFound();

  const date = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/enterprise/partners"
          aria-label={t("back")}
          className="flex size-10 items-center justify-center rounded-lg border border-hairline bg-white text-ink-strong hover:bg-surface"
        >
          <span aria-hidden className="msym text-[20px] rtl:-scale-x-100">
            arrow_back
          </span>
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
            {t("detailTitle")}
          </p>
          <h1 className="font-display text-3xl font-bold text-pine">{d.partner.name}</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Info
          label={t("colType")}
          value={d.partner.type === "PHARMACY" ? t("pharmacies") : t("practices")}
        />
        <Info label={t("tier")} value={d.partner.tier} />
        <Info
          label={t("colJoined")}
          value={d.partner.joinedAt ? date(d.partner.joinedAt) : "—"}
        />
        <Info label={t("colPatients")} value={String(d.patients.length)} />
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <h2 className="border-b border-hairline px-6 py-4 font-display text-xl font-bold text-pine">
          {t("patientList")}
        </h2>

        {d.patients.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colPatient")}</th>
                  <th className="px-6 py-3 text-start">{t("colCondition")}</th>
                  <th className="px-6 py-3 text-start">{t("colLastReview")}</th>
                  <th className="px-6 py-3 text-start">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {d.patients.map((p) => (
                  <tr key={p.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink-strong">{p.name}</p>
                      <p className="font-mono text-xs text-muted">{p.patientRef}</p>
                      {p.openFlags > 0 ? (
                        <span className="mt-1 inline-block rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                          {t("flags", { count: p.openFlags })}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-[#eef2fe] px-2.5 py-1 text-xs font-bold text-info">
                        {p.condition ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted">
                      {p.lastReviewAt ? date(p.lastReviewAt) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          p.overdue ? "text-red-600" : "text-pine-600"
                        }`}
                      >
                        <span aria-hidden className="size-2 rounded-full bg-current" />
                        {p.overdue ? t("statusOverdue") : t("statusOnTrack")}
                      </span>
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

function Info({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-pine">{value}</p>
    </div>
  );
}
