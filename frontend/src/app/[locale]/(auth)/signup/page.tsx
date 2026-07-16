import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { SignupShell } from "@/components/auth/SignupShell";

const ROLE_CARDS = [
  { role: "patient", icon: "person" },
] as const;

/* Role chooser — entry point of signup. One card per role, Figma design language. */
export default function SignupPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("auth.signup.chooseRole");
  const ts = useTranslations("auth.signup");

  return (
    <SignupShell>
      <h1 className="mt-7 font-display text-3xl font-semibold text-ink-strong">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ROLE_CARDS.map(({ role, icon }) => (
          <Link
            key={role}
            href={`/signup/${role}`}
            className="cw-watermark group rounded-xl border border-hairline bg-white p-5
                       transition-all hover:border-pine-600 hover:shadow-md"
          >
            <span
              aria-hidden
              className="msym flex size-11 items-center justify-center rounded-full
                         bg-mint/30 text-[24px] text-pine-600"
            >
              {icon}
            </span>
            <h2 className="mt-3 text-lg font-bold text-ink-strong group-hover:text-pine-600">
              {t(role)}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t(`${role}Desc`)}</p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-ink-strong">
        {ts("haveAccount")}{" "}
        <Link href="/login" className="font-bold text-pine-600 hover:underline">
          {ts("loginLink")}
        </Link>
      </p>
    </SignupShell>
  );
}
