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
  strainFeedback?: {
    strainName: string;
    category: string;
    manufacturer?: string | null;
    batchNumber?: string | null;
    ratingScore: number;
    overallAssessment: "GOOD" | "MODERATE" | "BAD";
    perceivedEffects: string[];
    effectDescription?: string | null;
    symptomsHelped: string[];
    wouldBuyAgain: boolean;
    consumptionMethod?: string | null;
    patientComment?: string | null;
    submittedAt: string;
  };
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
  const [actioning, setActioning] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallType, setPaywallType] = useState<PaywallType>(null);

  async function handleDownload(docId: string) {
    if (actioning === docId) return;
    setActioning(docId);
    try {
      const url = `/api/documents/file/${docId}`;
      const res = await fetch(url, { credentials: "include" });
      
      const data = await res.clone().json().catch(() => null);
      if (data && !res.ok) {
        if (data.message === "UPGRADE_REQUIRED") {
          setPaywallType("patient");
          setPaywallOpen(true);
          return;
        } else if (data.message === "PARTNER_INACTIVE") {
          setPaywallType("partner");
          setPaywallOpen(true);
          return;
        }
        alert(data.message || "Download failed");
        return;
      }
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      let filename = `report-${docId}.pdf`;
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (match != null && match[1]) {
        filename = match[1].replace(/['"]/g, "");
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Network error: " + msg);
    } finally {
      setActioning(null);
    }
  }

  const dosage = data.series.map((s) => s.dosageG ?? 0);
  const relief = data.series.map((s) => 10 - (s.pain ?? 0)); // relief = inverse pain
  const labels = data.series.map((s, i) =>
    i % Math.max(1, Math.ceil(data.series.length / 6)) === 0 ? s.date.slice(5) : "",
  );

  // 30-day plan progress (client's Phase 1/2/3 model).
  const planPct = Math.min(100, Math.round((data.day / 30) * 100));

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
      const url = `${API_URL}/documents/patient/${data.patient.id}?type=${type}`;
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
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                  Monatliches Patienten-Feedback
                </span>
                <h2 className="font-display text-2xl font-bold text-pine">
                  {data.strainFeedback?.strainName || "Bedrocan 22/1 (Sativa Flos)"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted">
                  <span className="rounded bg-surface px-2 py-0.5 font-bold text-ink-strong">
                    {data.strainFeedback?.category || "Medizinalblüten"}
                  </span>
                  <span>Hersteller: {data.strainFeedback?.manufacturer || "Bedrocan"}</span>
                  <span>· Charge: {data.strainFeedback?.batchNumber || "NL-2026-B849"}</span>
                  <span>· {data.strainFeedback?.consumptionMethod || "Vaporizer"}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-display text-2xl font-bold text-pine">
                    {data.strainFeedback?.ratingScore ?? 4.8}
                  </span>
                  <span className="text-sm font-semibold text-muted">/ 5.0</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  data.strainFeedback?.overallAssessment === "BAD"
                    ? "bg-red-50 text-red-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}>
                  <span aria-hidden className="msym text-[14px]">
                    {data.strainFeedback?.overallAssessment === "BAD" ? "thumb_down" : "thumb_up"}
                  </span>
                  {data.strainFeedback?.overallAssessment === "BAD" ? "Unbefriedigend" : "Sehr gut / Empfohlen"}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Perceived Effect */}
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage-900">
                  <span className="msym text-[16px] text-pine-600">psychology</span>
                  Wahrgenommene Wirkung
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(data.strainFeedback?.perceivedEffects || [
                    "Schmerzlindernd",
                    "Körperlich entspannend",
                    "Stimmungsaufhellend / leicht euphorisch",
                    "Schlaffördernd",
                  ]).map((eff, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-mint/40 bg-mint/20 px-3 py-1 text-xs font-bold text-pine-800"
                    >
                      {eff}
                    </span>
                  ))}
                </div>
                {data.strainFeedback?.effectDescription ? (
                  <p className="mt-2 text-xs text-ink-strong leading-relaxed bg-surface/80 p-3 rounded-lg border border-hairline">
                    {data.strainFeedback.effectDescription}
                  </p>
                ) : null}
              </div>

              {/* Symptoms Helped With */}
              <div>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage-900">
                  <span className="msym text-[16px] text-info">healing</span>
                  Gelinderte Symptome
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(data.strainFeedback?.symptomsHelped || [
                    data.patient.condition || "Chronische Schmerzen",
                    "Schlafstörungen",
                    "Spastik",
                  ]).map((sym, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Would buy again indicator */}
              <div className="rounded-xl border border-hairline bg-surface/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sage-900">
                    Wiederkauf-Empfehlung des Patienten
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    data.strainFeedback?.wouldBuyAgain === false
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    <span aria-hidden className="msym text-[16px]">
                      {data.strainFeedback?.wouldBuyAgain === false ? "cancel" : "verified"}
                    </span>
                    {data.strainFeedback?.wouldBuyAgain === false
                      ? "Nein, Sortenwechsel erwünscht"
                      : "Ja, würde Patient definitiv wieder kaufen"}
                  </span>
                </div>
                {data.strainFeedback?.patientComment ? (
                  <div className="mt-3 border-t border-hairline/60 pt-3">
                    <p className="text-xs italic text-muted">
                      &bdquo;{data.strainFeedback.patientComment}&ldquo;
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-brand p-6 text-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <h2 className="font-display text-xl font-bold">Sorten-Review Fazit</h2>
                <span className="rounded-md bg-mint-bright/20 px-2 py-0.5 text-[10px] font-bold uppercase text-mint-bright">
                  Monat 1/3
                </span>
              </div>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-white/90">
                <div className="rounded-lg bg-white/10 p-3.5">
                  <p className="font-bold text-mint-bright text-xs uppercase tracking-wider">
                    Therapeutische Einschätzung
                  </p>
                  <p className="mt-1 text-xs text-white/90">
                    Hohe Zufriedenheit mit der Sorte {data.strainFeedback?.strainName || "Bedrocan 22/1"}. 
                    Gute Symptomkontrolle ohne berichtete schwerwiegende Nebenwirkungen.
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 p-3.5">
                  <p className="font-bold text-mint-bright text-xs uppercase tracking-wider">
                    Versorgungsempfehlung
                  </p>
                  <p className="mt-1 text-xs text-white/90">
                    Patient wünscht Fortführung der aktuellen Verordnung. Ausreichender Lagerbestand für Folgerezepte sollte vorgehalten werden.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-lg bg-mint-bright px-4 py-3 text-sm font-bold uppercase tracking-wide text-pine hover:bg-mint transition-colors"
            >
              Sortenbewertung bestätigen & weiter
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
                      <button
                        onClick={() => handleDownload(r.id)}
                        disabled={actioning === r.id}
                        className="shrink-0 font-bold text-pine-600 hover:underline disabled:opacity-50"
                      >
                        {actioning === r.id ? t("downloading") : t("download")}
                      </button>
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
      {/* Force Turbopack Cache Invalidation */}
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
