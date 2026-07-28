import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/auth/BrandMark";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { LoginForm } from "./LoginForm";

/* Figma 3.1 — Login. Split screen: brand-gradient hero left, form right. */
export default function LoginPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("auth");
  const tc = useTranslations("common");

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden bg-white">
      {/* Left — hero (hidden on small screens) */}
      <aside className="relative hidden h-dvh flex-col justify-between overflow-hidden bg-[#051a11] p-12 lg:flex text-white">
        {/* Dynamic background lighting */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(52,211,153,0.06),transparent_60%)] pointer-events-none" />

        {/* Top / Center — Elegant Brand Display */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-6 transition-transform duration-300 hover:scale-[1.02]">
            {/* Glowing Logo Badge */}
            <div className="relative flex size-32 xl:size-40 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] group-hover:border-emerald-400/30 group-hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-transparent.png"
                alt="Cannathera"
                className="relative size-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
              />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-4xl xl:text-5xl font-extrabold tracking-[0.12em] text-white drop-shadow-md">
                CANNATHERA
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs xl:text-sm font-bold uppercase tracking-[0.2em] text-emerald-300/80">
                <span>Struktur</span>
                <span className="text-amber-400">•</span>
                <span>Orientierung</span>
                <span className="text-amber-400">•</span>
                <span>Verbindlichkeit</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom text block */}
        <div className="relative z-10 mx-auto w-full max-w-lg border-t border-white/10 pt-6">
          <h1 className="font-display text-2xl xl:text-3xl font-bold leading-snug text-white">
            {t("hero.title")}
          </h1>
          <p className="mt-3 text-sm xl:text-base leading-relaxed text-emerald-100/70">
            {t("hero.subtitle")}
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-emerald-100/50">
            <span className="flex items-center gap-2">
              <span aria-hidden className="msym text-[18px] text-emerald-400">verified_user</span>
              {t("hero.certified")}
            </span>
            <span aria-hidden className="h-3 w-px bg-white/20" />
            <span className="flex items-center gap-2">
              <span aria-hidden className="msym text-[18px] text-emerald-400">lock</span>
              {t("hero.gdpr")}
            </span>
          </div>
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex min-h-dvh flex-col items-center bg-white px-5 py-6 sm:px-6 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:none] lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden">
        <div className="my-auto w-full max-w-md py-2">
          <BrandMark size={52} />
          <h2 className="mt-5 font-display text-3xl font-bold text-pine">
            {t("login.title")}
          </h2>
          <p className="mt-2 text-muted">{t("login.subtitle")}</p>

          <LoginForm />

          <div className="mt-6 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {t("login.or")}
            </span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <p className="mt-5 text-center text-ink-strong">
            {t("login.noAccount")}{" "}
            <Link
              href="/signup/patient"
              className="font-bold text-pine-600 hover:underline"
            >
              {t("login.createAccount")}
            </Link>
          </p>

          <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-muted">
            <Link href="/imprint" className="hover:text-ink-strong">
              {tc("imprint")}
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-ink-strong">
              {tc("privacy")}
            </Link>
            <span aria-hidden>·</span>
            <LocaleSwitcher direction="up" />
          </footer>
        </div>
      </main>
    </div>
  );
}
