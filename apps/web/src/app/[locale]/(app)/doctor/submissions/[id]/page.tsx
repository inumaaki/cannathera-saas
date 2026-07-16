import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { BackButton, PrintButton } from "./PrintButton";
import { requirePermission } from "@/lib/permissions";

type SubmissionView = {
  id: string;
  submittedAt: string | null;
  questionnaire: string;
  patientName: string;
  patientRef: string | null;
  redFlags: Array<{ id: string; severity: string; message: string }>;
  sections: Array<{
    title: string;
    answers: Array<{ label: string; type: string; value: unknown }>;
  }>;
};

/* Doctor view of one questionnaire submission (answers resolved to labels). */
export default async function SubmissionDetail({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, tf, ts, format, s] = await Promise.all([
    getTranslations("doctor.patient"),
    getTranslations("patient.forms"),
    getTranslations("doctor.submission"),
    getFormatter(),
    apiServer<SubmissionView>(`/doctor/submissions/${encodeURIComponent(id)}`),
  ]);
  if (!s) notFound();

  const display = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(", ");
    if (v === true) return tf("yes");
    if (v === false) return tf("no");
    return String(v ?? "—");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <BackButton label={ts("back")} />
        <PrintButton label={ts("print")} />
      </div>
      <h1 className="font-display text-3xl font-bold text-pine">{s.questionnaire}</h1>
      <p className="mt-1 text-muted">
        {s.patientName}
        {s.patientRef ? ` · ${s.patientRef}` : ""} ·{" "}
        {s.submittedAt
          ? format.dateTime(new Date(s.submittedAt), {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </p>

      {s.redFlags.length > 0 ? (
        <div className="mt-4 space-y-2">
          {s.redFlags.map((f) => (
            <p
              key={f.id}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
                f.severity === "CRITICAL"
                  ? "bg-red-100 text-red-700"
                  : "bg-[#fdf3d7] text-gold"
              }`}
            >
              <span aria-hidden className="msym text-[18px]">
                warning
              </span>
              {f.message}
            </p>
          ))}
        </div>
      ) : null}

      {s.sections.map((sec) => (
        <section
          key={sec.title}
          className="cw-watermark mt-5 rounded-xl border border-hairline bg-white p-6"
        >
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
            {sec.title}
          </h2>
          <dl className="mt-4 space-y-4">
            {sec.answers.map((a) => (
              <div key={a.label} className="border-b border-hairline pb-3 last:border-0 last:pb-0">
                <dt className="text-sm text-muted">{a.label}</dt>
                <dd className="mt-0.5 font-semibold text-ink-strong">{display(a.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
