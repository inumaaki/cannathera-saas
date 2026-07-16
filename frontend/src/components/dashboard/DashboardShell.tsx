import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

/* Placeholder dashboard shell (M1). Real dashboards arrive with Figma (M2+).
   Protects the route: no valid session or wrong role -> /login. */
export async function DashboardShell({
  role,
  roleKey,
  locale,
}: Readonly<{
  role: SessionUser["role"];
  roleKey: "patient" | "doctor" | "pharmacy" | "enterprise";
  locale: string;
}>) {
  const user = await getSessionUser();
  if (!user || user.role !== role) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between bg-brand px-6 py-3 text-white">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Cannathera"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="font-display text-xl font-bold">Cannathera</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:inline text-white/80">
            {t("loggedInAs")} <strong className="text-white">{user!.email}</strong>
          </span>
          <LogoutButton label={tc("logout")} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-ink-strong">
          {t(`titles.${roleKey}`)}
        </h1>
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-10 text-center">
          <span aria-hidden className="msym text-[40px] text-pine-600">
            construction
          </span>
          <p className="mt-4 text-muted">{t("placeholder")}</p>
        </section>
        <p className="mt-8 text-center text-sm text-muted">{tc("poweredBy")}</p>
      </main>
    </div>
  );
}
