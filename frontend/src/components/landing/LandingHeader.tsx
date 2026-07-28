"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";

export function LandingHeader() {
  const t = useTranslations("common");
  const tl = useTranslations("landing.header");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-white/75 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group transition-transform duration-300 active:scale-[0.97]">
          <Image
            src="/brand/logo.png"
            alt={tl("logoAlt")}
            width={34}
            height={34}
            className="rounded-full transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-105"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-pine transition-colors group-hover:text-pine-600 sm:text-xl">
            Cannathera
          </span>
        </Link>

        {/* Navigation links */}
        <div className="hidden lg:flex flex-1 min-w-0 mx-1 items-center justify-end xl:justify-center relative">
          <div className="w-max max-w-full overflow-hidden rounded-full border border-hairline/45 bg-[#f5f8f6]/50">
            <nav className="flex items-center gap-0.5 xl:gap-1 text-[13px] xl:text-sm font-semibold text-muted p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Link href="/" className="px-2.5 xl:px-4 py-1.5 rounded-full text-[#4a5e54] hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("home")}
              </Link>
              <Link href="/features" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("features")}
              </Link>
              <Link href="/physicians" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("physicians")}
              </Link>
              <Link href="/pharmacies" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("pharmacies")}
              </Link>
              <Link href="/telemedicine" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("telemedicine")}
              </Link>
              <Link href="/pricing" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("pricing")}
              </Link>
              <Link href="/founder" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("founder")}
              </Link>
              <Link href="/faq" className="px-2.5 xl:px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                {tl("faq")}
              </Link>
            </nav>
          </div>
        </div>

        {/* Right CTAs */}
        <div className="hidden items-center gap-2 lg:flex xl:gap-3">
          <LocaleSwitcher direction="down" />
          <Link
            href="/login"
            className="text-sm font-bold text-muted hover:text-pine hover:bg-pine/5 px-3.5 py-1.5 rounded-full transition-all duration-200"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="flex h-9 items-center justify-center rounded-full bg-pine px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-pine-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-md hover:shadow-lg shadow-pine/10"
          >
            {t("signup")}
          </Link>
        </div>

        <button
          type="button"
          aria-label={tl("menu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline text-pine transition hover:bg-surface lg:hidden"
        >
          <span aria-hidden className="msym text-[22px]">{menuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label={tl("menu")}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-16 z-40 bg-pine/30 backdrop-blur-sm lg:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tl("menu")}
            className="absolute inset-x-3 top-[4.5rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-hairline bg-white p-3 shadow-2xl sm:inset-x-6 lg:hidden"
          >
            <nav className="grid gap-1 text-sm font-bold text-ink-strong">
              <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("home")}</Link>
              <Link href="/features" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("features")}</Link>
              <Link href="/physicians" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("physicians")}</Link>
              <Link href="/pharmacies" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("pharmacies")}</Link>
              <Link href="/telemedicine" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("telemedicine")}</Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("pricing")}</Link>
              <Link href="/founder" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("founder")}</Link>
              <Link href="/faq" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 hover:bg-surface">{tl("faq")}</Link>
            </nav>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-ink-strong">
                <span aria-hidden className="msym text-[19px] text-brand">language</span>
                {tl("language")}
              </span>
              <LocaleSwitcher direction="down" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl border border-pine text-sm font-bold text-pine"
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-xl bg-pine text-sm font-bold text-white"
              >
                {t("signup")}
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
