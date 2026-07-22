import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
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
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Left — hero (hidden on small screens) */}
      <aside className="hidden lg:flex flex-col justify-between bg-brand-gradient p-10 text-white">
        <Link href="/" className="inline-block w-fit">
          <Image
            src="/brand/logo-banner-transparent.png"
            alt="Cannathera"
            width={280}
            height={80}
            className="w-56 h-auto"
            priority
          />
        </Link>
        <div className="max-w-lg">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight whitespace-pre-line">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/90">
            {t("hero.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-white/80">
          <span>{t("hero.certified")}</span>
          <span aria-hidden className="h-4 w-px bg-white/40" />
          <span>{t("hero.gdpr")}</span>
        </div>
      </aside>
 
      {/* Right — form */}
      <main className="flex flex-col items-center justify-center bg-white px-6 py-6">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-block w-fit">
            <Image
              src="/brand/logo.png"
              alt=""
              width={52}
              height={52}
              className="rounded-full"
              priority
            />
          </Link>
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
            <Link href="/signup" className="font-bold text-pine-600 hover:underline">
              {t("login.createAccount")}
            </Link>
          </p>

          <footer className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
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
