import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";

/* Onboarding entry (Figma 6-352): gauge, headline, trust badges, Continue. */
export default function PatientWelcome({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("patient.welcome");

  return (
    <div className="flex min-h-[70dvh] flex-col items-center pt-10 text-center">
      <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden>
        <circle cx="85" cy="85" r="80" fill="none" stroke="#9ef5be" strokeWidth="5" />
        <circle
          cx="85"
          cy="85"
          r="66"
          fill="none"
          stroke="#d9d9d9"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <line x1="85" y1="85" x2="48" y2="112" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
        <circle cx="85" cy="85" r="9" fill="#0b3d2a" />
      </svg>

      <h1 className="mt-8 max-w-xs font-display text-4xl font-bold leading-tight text-pine">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted">{t("subtitle")}</p>

      <div className="mt-8 grid w-full grid-cols-2 gap-4">
        <div className="rounded-2xl border border-hairline bg-white px-4 py-5">
          <span aria-hidden className="msym text-[26px] text-pine-600">
            verified_user
          </span>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-sage-900">
            {t("clinicalGrade")}
          </p>
        </div>
        <div className="rounded-2xl border border-hairline bg-white px-4 py-5">
          <span aria-hidden className="msym text-[26px] text-pine-600">
            shield_lock
          </span>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-sage-900">
            {t("secureData")}
          </p>
        </div>
      </div>

      <Link
        href="/patient"
        className="mt-auto mb-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl
                   bg-pine-600 text-base font-bold text-white hover:bg-pine"
      >
        {t("continue")}
        <span aria-hidden className="msym rtl:-scale-x-100">
          arrow_forward
        </span>
      </Link>
    </div>
  );
}
