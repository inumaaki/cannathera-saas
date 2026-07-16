import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewPatientForm } from "./NewPatientForm";
import { requirePermission } from "@/lib/permissions";

/* Doctor onboards a patient: account created here, patient sets their own
   password via the setup link and edits their data themselves afterwards. */
export default async function NewPatientPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:create");

  if (denied) return denied;
  const t = await getTranslations("doctor.newPatient");

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/doctor/patients"
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink-strong"
      >
        <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
          arrow_back
        </span>
        {t("backToRoster")}
      </Link>
      <section className="cw-watermark rounded-xl border border-hairline bg-white p-7">
        <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-2 leading-relaxed text-muted">{t("subtitle")}</p>
        <div className="mt-6">
          <NewPatientForm />
        </div>
      </section>
    </div>
  );
}
