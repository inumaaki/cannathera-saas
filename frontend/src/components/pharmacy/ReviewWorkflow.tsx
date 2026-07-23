"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, API_URL, ApiError } from "@/lib/api";
import { CorrelationChart, ProgressRing } from "@/components/patient/charts";
import { PaywallModal, type PaywallType } from "@/components/paywall/PaywallModal";

export type Summary = {
  patient: {
    id: string;
    name: string;
    patientRef: string | null;
    condition: string | null;
    tier: string;
    therapyStart: string;
    lastReviewAt: string | null;
    totalLogs: number;
  };
  practice: { id: string; name: string } | null;
  redFlags: Array<{
    id: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    type: string;
    periodStart: string;
    periodEnd: string;
    fileUrl: string;
    createdAt: string;
  }>;
  day: number;
  phase: number;
  adherence: number;
  avgDosageG: number | null;
  efficacy: number | null;
  painChange: number | null;
  series: Array<{
    date: string;
    pain: number | null;
    sleep: number | null;
    dosageG: number | null;
  }>;
};

/* Figma 6.3 — 3-step review workflow: read trend, confirm, complete. */
export function ReviewWorkflow({ data }: Readonly<{ data: Summary }>) {
  const t = useTranslations("pharmacy.workflow");
  const format = useFormatter();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>(null);

  const dosage = data.series.map((s) => s.dosageG ?? 0);
  const relief = data.series.map((s) => 10 - (s.pain ?? 0)); // relief = inverse pain
  const labels = data.series.map((s, i) =>
    i % Math.max(1, Math.ceil(data.series.length / 6)) === 0 ? s.date.slice(5) : "",
  );

  // 90-day plan progress (client's Phase 1/2/3 model).
  const planPct = Math.min(100, Math.round((data.day / 90) * 100));

  async function complete() {
    setBusy(true);
    setError(null);
    try {
      await api(`/pharmacy/reviews/${data.patient.id}/complete`, {
        method: "POST",
        body: { note: note.trim() || undefined },
      });
      setDone(true);
      router.refresh();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "ERROR";
      if (code === "UPGRADE_REQUIRED") {
        setPaywallType("patient");
        setPaywallOpen(true);
      } else if (code === "PARTNER_INACTIVE") {
        setPaywallType("partner");
        setPaywallOpen(true);
      } else {
        setError(code);
      }
    } finally {
      setBusy(false);
    }
  }

  async function downloadReport(type: string) {
    try {
      const url = `${API_URL}/reports/patient/${data.patient.id}?type=${type}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 403) {
          const resData = await res.json().catch(() => ({}));
          if (resData.message === "UPGRADE_REQUIRED") {
            setPaywallType("patient");
            setPaywallOpen(true);
            return;
          } else if (resData.message === "PARTNER_INACTIVE") {
            setPaywallType("partner");
            setPaywallOpen(true);
            return;
          }
        }
        alert(t("actionFailed"));
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? `cannathera-${type.toLowerCase()}-${data.patient.id}.pdf`;

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      alert(t("actionFailed"));
    }
  }

  const day = (iso: string) =>
    format.dateTime(new Date(iso), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const REPORT_TYPES = [
    { type: "MONTHLY", label: t("reportMonthly") },
    { type: "QUARTERLY", label: t("reportQuarterly") },
    { type: "LONG_TERM", label: t("reportLongTerm") },
  ];

  return (
    <>
      {/* Patient context: who else is on this case, and the way into their data. */}
      <section className="mt-6 grid gap-4 rounded-xl border border-hairline bg-white p-5 md:grid-cols-4">
        <Ctx label={t("practice")} value={data.practice?.name ?? t("noPractice")} />
        <Ctx label={t("condition")} value={data.patient.condition ?? "—"} />
        <Ctx label={t("package")} value={data.patient.tier} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
            {t("therapyDay")}
          </p>
          <p className="mt-1 font-bold text-ink-strong">
            {t("day", { day: data.day })} · {t("phase", { phase: data.phase })}
          </p>
          <Link
            href={{
              pathname: "/pharmacy/logs",
              query: { q: data.patient.patientRef ?? data.patient.name, days: "90" },
            }}
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-pine-600 hover:underline"
          >
            {t("logCount", { count: data.patient.totalLogs })}
            <span aria-hidden className="msym text-[14px] rtl:-scale-x-100">
              chevron_right
            </span>
          </Link>
        </div>
      </section>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                (done ? 4 : step) > n
                  ? "bg-pine-600 text-white"
                  : step === n
                    ? "bg-brand text-white"
                    : "bg-[#eef1f8] text-muted"
              }`}
            >
              {(done ? 4 : step) > n ? "✓" : n}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wide max-md:hidden ${
                step === n ? "text-ink-strong" : "text-muted"
              }`}
            >
              {t("step", { n })}
            </span>
            {n < 3 ? (
              <span
                aria-hidden
                className={`h-0.5 flex-1 rounded-full ${
                  (done ? 4 : step) > n ? "bg-pine-600" : "bg-hairline"
                }`}
              />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_5fr]">
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("trendTitle")}
              </h2>
              <span className="rounded-md bg-[#eef1f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-strong">
                {t("period")}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <Metric
                label={t("adherenceRate")}
                value={`${data.adherence}%`}
                tone="text-pine-600"
              />
              <Metric
                label={t("avgDosage")}
                value={data.avgDosageG != null ? `${data.avgDosageG} g` : "—"}
                tone="text-ink-strong"
              />
              <Metric
                label={t("efficacy")}
                value={data.efficacy != null ? `${data.efficacy}/10` : "—"}
                tone="text-info"
                note={t("efficacyNote")}
              />
            </dl>

            {data.series.length > 1 ? (
              <div className="mt-6">
                <CorrelationChart
                  dosage={dosage}
                  relief={relief}
                  labels={labels}
                  width={640}
                  height={220}
                />
              </div>
            ) : null}
          </section>

          <section className="rounded-xl bg-brand p-6 text-white">
            <h2 className="font-display text-xl font-bold">{t("insightTitle")}</h2>
            <div className="mt-5 flex justify-center">
              <ProgressRing
                pct={planPct}
                size={170}
                stroke={14}
                color="#9ef5be"
                track="rgba(255,255,255,0.18)"
              >
                <p className="font-display text-2xl font-bold text-white">
                  {t("day", { day: data.day })}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-mint">
                  {t("phase", { phase: data.phase })}
                </p>
              </ProgressRing>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-white/80">
              {t("insightText", {
                phase: data.phase,
                adherence: data.adherence,
                pain: data.painChange ?? 0,
              })}
            </p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-5 w-full rounded-lg bg-mint-bright px-4 py-3 text-sm font-bold uppercase tracking-wide text-pine hover:bg-mint"
            >
              {t("acknowledge")}
            </button>
          </section>

          {/* Open red flags — the clinical reason a review can't be rubber-stamped. */}
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-pine">
              <span aria-hidden className="msym text-[22px] text-accent-print">
                flag
              </span>
              {t("warnings")}
            </h2>
            {data.redFlags.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("noWarnings")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.redFlags.map((f) => (
                  <li
                    key={f.id}
                    className={`rounded-lg border-s-4 p-3 ${
                      f.severity === "CRITICAL"
                        ? "border-red-600 bg-red-50"
                        : "border-gold bg-[#fdf6e3]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink-strong">{f.message}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {f.severity} · {day(f.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* The billable artefact: the Monatsreview PDF. */}
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <h2 className="font-display text-xl font-bold text-pine">
              {t("reportTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("reportText")}</p>
            <div className="mt-4 space-y-2">
              {REPORT_TYPES.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => downloadReport(r.type)}
                  className="flex w-full items-center justify-between rounded-lg border border-hairline px-4 py-2.5 text-sm font-bold text-ink-strong hover:border-pine-600 hover:text-pine-600"
                >
                  {r.label}
                  <span aria-hidden className="msym text-[18px]">
                    picture_as_pdf
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{t("reportHint")}</p>

            {data.reports.length > 0 ? (
              <>
                <h3 className="mt-5 text-[10px] font-bold uppercase tracking-wide text-sage-900">
                  {t("reportHistory")}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.reports.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-muted">
                        {r.type} · {day(r.periodStart)}–{day(r.periodEnd)}
                      </span>
                      <a
                        href={`${API_URL}/reports/file/${r.id}`}
                        className="shrink-0 font-bold text-pine-600 hover:underline"
                      >
                        {t("download")}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {step === 2 ? (
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-xl font-bold text-pine">{t("step2Title")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {t("step2Text")}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder={t("notePlaceholder")}
            className="mt-4 w-full rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
            >
              {t("back")}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
            >
              {t("acknowledge")}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-6">
          {done ? (
            <div className="py-6 text-center">
              <span
                aria-hidden
                className="msym text-[56px] text-pine-600"
              >
                task_alt
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-pine">
                {t("done")}
              </h2>
              <button
                type="button"
                onClick={() => router.push("/pharmacy/reviews")}
                className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
              >
                {t("backToList")}
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold text-pine">
                {t("step3Title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {t("step3Text")}
              </p>
              {note.trim() ? (
                <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-strong">
                  {note}
                </p>
              ) : null}
              {error ? (
                <p className="mt-4 text-sm font-semibold text-red-600">
                  {error === "UPGRADE_REQUIRED"
                    ? t("upgradeRequired")
                    : error === "PARTNER_INACTIVE"
                    ? t("partnerInactive")
                    : error}
                </p>
              ) : null}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  onClick={complete}
                  disabled={busy}
                  className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
                >
                  {t("complete")}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}
      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} type={paywallType} />
    </>
  );
}

function Ctx({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </p>
      <p className="mt-1 font-bold text-ink-strong">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  note,
}: Readonly<{ label: string; value: string; tone: string; note?: string }>) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
        {label}
      </dt>
      <dd className={`mt-1 font-display text-3xl font-bold ${tone}`}>{value}</dd>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}
