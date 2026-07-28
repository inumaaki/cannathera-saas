"use client";

import { useTranslations } from "next-intl";

export function BackButton() {
  const t = useTranslations("common");

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-pine-600 hover:text-pine transition-colors hover:underline"
    >
      <span aria-hidden className="msym text-[16px]">arrow_back</span>
      {t("back")}
    </button>
  );
}
