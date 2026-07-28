import { useTranslations } from "next-intl";
import { BrandMark } from "./BrandMark";

/* Figma 3.3 — signup split layout: solid deep-green hero left, content right. */
export function SignupShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations("auth.signup.hero");

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden bg-white">
      {/* Left — deep green panel */}
      <aside className="relative hidden h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-[#051a11] px-12 py-8 text-center text-white lg:flex">
        {/* Dynamic background lighting */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />

        <div className="relative flex size-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-transparent.png"
            alt="Cannathera"
            className="size-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]"
          />
        </div>

        <div className="max-w-md space-y-3 z-10">
          <h1 className="font-display text-3xl font-bold leading-snug">{t("title")}</h1>
          <p className="leading-relaxed text-emerald-100/70">{t("subtitle")}</p>
        </div>

        {/* Clinical Integrity Dial */}
        <figure className="relative z-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
          <svg width="128" height="128" viewBox="0 0 160 160" aria-hidden>
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="3"
            />
            <path
              d="M 30.3 30.3 A 70 70 0 0 1 129.7 30.3"
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.7"
            />
            <line
              x1="80"
              y1="80"
              x2="124"
              y2="36"
              stroke="#f97316"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="80" cy="80" r="8" fill="#ffffff" />
          </svg>
          <figcaption className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            {t("integrity")}
          </figcaption>
        </figure>
      </aside>

      {/* Right — content */}
      <main className="flex min-h-dvh flex-col items-center bg-white px-6 py-6 lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:none] lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden">
        <div className="my-auto w-full max-w-md">
          <BrandMark />
          {children}
        </div>
      </main>
    </div>
  );
}
