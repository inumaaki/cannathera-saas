import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import {
  PartnerActions,
  RemovePartnerButton,
} from "@/components/enterprise/PartnerActions";

type Row = {
  id: string;
  name: string;
  type: "PHARMACY" | "PRACTICE";
  city: string | null;
  joinedAt: string | null;
  patients: number;
  overdue: number;
  avgAdherence: number;
};

type Data = {
  rows: Row[];
  partners: { total: number; pharmacies: number; practices: number };
};
type Overview = {
  patients: number;
  overdueReviews: number;
  criticalFlags: number;
};
type Available = Array<{ id: string; name: string; type: string }>;

const TABS = [
  { key: "all", label: "all" },
  { key: "PRACTICE", label: "practices" },
  { key: "PHARMACY", label: "pharmacies" },
] as const;

/* Figma 8.3 — Partner Ecosystem. */
export default async function EnterprisePartners({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; q?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const type = TABS.some((x) => x.key === sp.type) ? sp.type! : "all";
  const q = sp.q?.trim().toLowerCase() ?? "";

  const [t, format, d, overview, available] = await Promise.all([
    getTranslations("enterprise.partners"),
    getFormatter(),
    apiServer<Data>(`/enterprise/partners?type=${type}`),
    apiServer<Overview>("/enterprise/overview"),
    apiServer<Available>("/enterprise/partners/available"),
  ]);

  const rows = (d?.rows ?? []).filter(
    (r) => !q || r.name.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q),
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <PartnerActions available={available ?? []} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="hub"
          tint="bg-mint/30 text-pine-600"
          value={d?.partners.total ?? 0}
          label={t("totalPartners")}
        />
        <Stat
          icon="groups"
          tint="bg-[#eef2fe] text-info"
          value={overview?.patients ?? 0}
          label={t("syncedPatients")}
          note={t("acrossNodes")}
        />
        <Stat
          icon="assignment_late"
          tint="bg-[#fdece0] text-accent-print"
          value={overview?.overdueReviews ?? 0}
          label={t("overdue")}
        />
        <Stat
          icon="warning"
          tint="bg-red-50 text-red-600"
          value={overview?.criticalFlags ?? 0}
          label={t("criticalFlags")}
        />
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
          <h2 className="font-display text-xl font-bold text-pine">{t("roster")}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-sage-900">{t("filterBy")}</span>
            {TABS.map((tab) => (
              <Link
                key={tab.key}
                href={
                  tab.key === "all"
                    ? "/enterprise/partners"
                    : { pathname: "/enterprise/partners", query: { type: tab.key } }
                }
                className={`rounded-lg px-3 py-1.5 font-bold ${
                  type === tab.key
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-surface hover:text-ink-strong"
                }`}
              >
                {t(tab.label)}
              </Link>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colPartner")}</th>
                  <th className="px-6 py-3 text-start">{t("colType")}</th>
                  <th className="px-6 py-3 text-start">{t("colJoined")}</th>
                  <th className="px-6 py-3 text-start">{t("colPatients")}</th>
                  <th className="px-6 py-3 text-start">{t("colAdherence")}</th>
                  <th className="px-6 py-3 text-start">{t("colOverdue")}</th>
                  <th className="px-6 py-3 text-end">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="msym flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint/30 text-[20px] text-pine-600"
                        >
                          {r.type === "PHARMACY" ? "local_pharmacy" : "medical_services"}
                        </span>
                        <div>
                          <Link
                            href={`/enterprise/partners/${r.id}`}
                            className="font-bold text-ink-strong hover:text-pine-600 hover:underline"
                          >
                            {r.name}
                          </Link>
                          <p className="text-xs text-muted">{r.city ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                          r.type === "PHARMACY"
                            ? "bg-mint/40 text-pine"
                            : "bg-[#eef2fe] text-info"
                        }`}
                      >
                        {r.type === "PHARMACY" ? t("pharmacies") : t("practices")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted">
                      {r.joinedAt
                        ? format.dateTime(new Date(r.joinedAt), {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-ink-strong">
                      {r.patients}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-20 rounded-full bg-[#e3e9f2]" aria-hidden>
                          <span
                            className="block h-full rounded-full bg-pine-600"
                            style={{ width: `${r.avgAdherence}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs font-bold text-ink-strong">
                          {r.avgAdherence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                          r.overdue > 0
                            ? "bg-red-50 text-red-600"
                            : "bg-mint/30 text-pine-600"
                        }`}
                      >
                        {r.overdue}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/enterprise/partners/${r.id}`}
                          className="rounded-lg bg-brand px-3 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                        >
                          {t("details")}
                        </Link>
                        <RemovePartnerButton id={r.id} name={r.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-hairline px-6 py-3">
          <a
            href={`${API_URL}/enterprise/export`}
            className="flex items-center gap-1.5 text-xs font-bold text-pine-600 hover:underline"
          >
            <span aria-hidden className="msym text-[16px]">
              download
            </span>
            {t("exportCsv")}
          </a>
          <p className="text-xs text-muted">
            {t("showing", { count: rows.length, total: d?.partners.total ?? 0 })}
          </p>
        </div>
      </section>
    </>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  note,
}: Readonly<{
  icon: string;
  tint: string;
  value: number;
  label: string;
  note?: string;
}>) {
  return (
    <div className="cw-watermark flex items-center gap-4 rounded-xl border border-hairline bg-white p-5">
      <span
        aria-hidden
        className={`msym flex size-12 items-center justify-center rounded-xl text-[24px] ${tint}`}
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-3xl font-bold text-pine">{value}</p>
        <p className="text-sm text-muted">{label}</p>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
    </div>
  );
}
