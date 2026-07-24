import { useTranslations } from "next-intl";
import { BrandMark } from "./BrandMark";

/* Figma 3.3 — signup split layout: solid deep-green hero left, content right. */
export function SignupShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations("auth.signup.hero");

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden">
      {/* Left — deep green panel */}
      <aside className="hidden h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-pine px-12 py-8 text-center text-white lg:flex">
        <span className="flex size-20 items-center justify-center rounded-full bg-white/10">
          <span aria-hidden className="msym text-[38px] text-white">
            psychiatry
          </span>
        </span>

        <div className="max-w-md">
          <h1 className="font-display text-3xl font-bold leading-snug">{t("title")}</h1>
          <p className="mt-4 leading-relaxed text-white/75">{t("subtitle")}</p>
        </div>

        {/* Gauge with orange needle (clinical integrity dial) */}
        <figure className="flex flex-col items-center gap-4">
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
              stroke="#9ef5be"
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
          <figcaption className="text-sm font-bold uppercase tracking-[0.25em] text-mint-bright">
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
