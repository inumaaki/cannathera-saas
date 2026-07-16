import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BrandMark } from "@/components/auth/BrandMark";
import { SetPasswordForm } from "./SetPasswordForm";

/* Forced first-login step for accounts created with a temporary password. */
export default function SetPasswordPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("auth.setPassword");

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-6">
      <div className="w-full max-w-xl rounded-xl border border-hairline bg-white px-8 py-8 shadow-sm">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <h1 className="mt-6 text-center font-display text-3xl font-bold text-ink-strong">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-muted">{t("subtitle")}</p>
        <SetPasswordForm />
      </div>
    </div>
  );
}
