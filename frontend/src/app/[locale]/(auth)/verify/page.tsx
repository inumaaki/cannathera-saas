import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BrandMark } from "@/components/auth/BrandMark";
import { VerifyForm } from "./VerifyForm";

/* Figma 3.2 — Two-Factor Verification. Centered card on off-white. */
export default function VerifyPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("auth.verify");

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-6">
      <div className="w-full max-w-2xl rounded-xl border border-hairline bg-white px-8 py-8 shadow-sm">
        <div className="flex justify-center">
          <BrandMark />
        </div>

        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink-strong">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-muted">{t("subtitle")}</p>

        <VerifyForm />

        <p className="mt-5 text-center text-sm font-semibold text-ink-strong">
          {t("troubleQuestion")}{" "}
          <a href="#support" className="hover:underline">
            {t("troubleLink")}
          </a>
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm font-semibold text-sage-900">
          <span aria-hidden className="msym text-[18px] text-pine-600">
            verified_user
          </span>
          {t("badgeGdpr")}
        </span>
        <span className="flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm font-semibold text-sage-900">
          <span aria-hidden className="msym text-[18px] text-info">
            lock
          </span>
          {t("badgeEncrypted")}
        </span>
      </div>

      <p className="mt-4 text-sm text-muted">{t("copyright")}</p>
    </div>
  );
}
