import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ReviewWorkflow, type Summary } from "@/components/pharmacy/ReviewWorkflow";

/* Figma 6.3 — Review Workflow for one patient. */
export default async function ReviewWorkflowPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; patientId: string }> }>) {
  const { locale, patientId } = await params;
  setRequestLocale(locale);

  const [t, data] = await Promise.all([
    getTranslations("pharmacy.workflow"),
    apiServer<Summary>(`/pharmacy/reviews/${patientId}`),
  ]);
  if (!data) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/pharmacy/reviews"
            aria-label={t("back")}
            className="flex size-10 items-center justify-center rounded-lg border border-hairline bg-white text-ink-strong hover:bg-surface"
          >
            <span aria-hidden className="msym text-[20px] rtl:-scale-x-100">
              arrow_back
            </span>
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
              {t("patientProfile")}
            </p>
            <h1 className="font-display text-3xl font-bold text-pine">
              {data.patient.name}
            </h1>
            <p className="font-mono text-xs text-muted">{data.patient.patientRef}</p>
          </div>
        </div>
      </div>

      <ReviewWorkflow data={data} />
    </>
  );
}
