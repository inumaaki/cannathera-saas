import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";

type FormMeta = { key: string; title: string; description: string | null; version: number };
type Submission = {
  id: string;
  submittedAt: string;
  version: { version: number; questionnaire: { key: string; title: string } };
};

/* Forms list — DB-driven questionnaires (M3 engine). New forms appear here
   automatically when published, no code changes. */
export default async function PatientForms({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, forms, submissions] = await Promise.all([
    getTranslations("patient.forms"),
    getFormatter(),
    apiServer<FormMeta[]>(`/questionnaires?locale=${locale}`),
    apiServer<Submission[]>("/questionnaires/submissions/mine"),
  ]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
      <p className="mt-1 text-muted">{t("subtitle")}</p>

      <div className="mt-5 space-y-4">
        {(forms ?? []).map((f) => (
          <Link
            key={f.key}
            href={`/patient/forms/${f.key}`}
            className="cw-watermark block rounded-2xl border border-hairline bg-white p-5 transition-all hover:border-pine-600"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-[22px] text-pine-600">
                <span aria-hidden className="msym">assignment</span>
              </span>
              <span className="text-xs text-muted">{t("version", { version: f.version })}</span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-ink-strong">{f.title}</h2>
            {f.description ? <p className="mt-1 text-sm text-muted">{f.description}</p> : null}
            <p className="mt-3 flex items-center gap-1 font-bold text-pine-600">
              {t("fill")}
              <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
                arrow_forward
              </span>
            </p>
          </Link>
        ))}
      </div>

      {(submissions?.length ?? 0) > 0 ? (
        <section className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-white">
          <h2 className="border-b border-hairline px-5 py-3 font-bold text-ink-strong">
            {t("previous")}
          </h2>
          {submissions!.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border-b border-hairline px-5 py-3 last:border-0"
            >
              <span aria-hidden className="msym text-[20px] text-pine-600">
                check_circle
              </span>
              <div>
                <p className="font-semibold text-ink-strong">
                  {s.version.questionnaire.title}
                </p>
                <p className="text-sm text-muted">
                  {t("submittedOn", {
                    date: format.dateTime(new Date(s.submittedAt), {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  })}
                </p>
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
