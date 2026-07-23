"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingFooter() {
  const t = useTranslations("common");
  const tf = useTranslations("landing.footer");

  return (
    <footer className="border-t border-hairline bg-white py-12 text-sm text-muted">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-pine">
                Cannathera
              </span>
            </div>
            <p className="text-xs text-muted max-w-xs">
              {tf("description")}
            </p>
          </div>

          {/* Directory Column 1 */}
          <div>
            <h4 className="font-bold text-ink-strong uppercase tracking-wider text-xs">{tf("portals")}</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/login" className="hover:text-pine-600 transition-colors">
                  {tf("patientArea")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-pine-600 transition-colors">
                  {tf("clinicalPortal")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-pine-600 transition-colors">
                  {tf("pharmacyPortal")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Directory Column 2 */}
          <div>
            <h4 className="font-bold text-ink-strong uppercase tracking-wider text-xs">{tf("company")}</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/imprint" className="hover:text-pine-600 transition-colors">
                  {t("imprint")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-pine-600 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Certifications Badge */}
          <div className="space-y-2">
            <h4 className="font-bold text-ink-strong uppercase tracking-wider text-xs">{tf("certifications")}</h4>
            <div className="flex flex-col gap-1.5 pt-1 text-xs font-semibold text-sage-900">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="msym text-[14px] text-pine-600">
                  verified_user
                </span>
                {tf("gdpr")}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="msym text-[14px] text-pine-600">
                  security
                </span>
                {tf("ceClass")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-hairline pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>{tf("copyright")}</p>
          <div className="flex gap-4">
            <Link href="/imprint" className="hover:underline">
              {t("imprint")}
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
