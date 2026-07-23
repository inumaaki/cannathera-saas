"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { LiveNotifications } from "@/components/common/LiveNotifications";

/* `perm: null` = always visible. Otherwise the item needs that permission. */
const NAV = [
  { href: "/doctor", key: "dashboard", icon: "dashboard", perm: "patients:view" },
  { href: "/doctor/patients", key: "patients", icon: "group", perm: "patients:view" },
  { href: "/doctor/alerts", key: "alerts", icon: "warning", perm: "alerts:view" },
  { href: "/doctor/reports", key: "reports", icon: "monitoring", perm: "reports:view" },
  {
    href: "/doctor/settings/profile",
    key: "settings",
    icon: "settings",
    perm: "settings:practice",
    // Team-only members still need Settings to reach Team Management.
    altPerm: "settings:team",
  },
  { href: "/doctor/help", key: "help", icon: "help", perm: null },
] as const;

type Alert = {
  id: string;
  severity: string;
  message: string;
  patientId: string;
  patientName: string;
};

/* Clinical Portal frame (Figma 5.x). Bell polls open red-flags every 30s. */
export function DoctorShell({
  children,
  userName,
  logoUrl = null,
  permissions = [],
}: Readonly<{
  children: React.ReactNode;
  userName: string;
  logoUrl?: string | null;
  permissions?: string[];
}>) {
  const t = useTranslations("doctor.shell");
  const can = (p: string | null) => p === null || permissions.includes(p);
  const pathname = usePathname();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Near-realtime: poll open red-flags for the bell badge.
  const canViewAlerts = permissions.includes("alerts:view");
  useEffect(() => {
    if (!canViewAlerts) return;
    let active = true;
    async function poll() {
      try {
        const data = await api<Alert[]>("/doctor/red-flags?view=unreviewed");
        if (active) setAlerts(data.slice(0, 6));
      } catch {
        /* session may have expired — badge just stays stale */
      }
    }
    void poll();
    const id = setInterval(poll, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pathname, canViewAlerts]);

  const isActive = (href: string) =>
    href === "/doctor"
      ? pathname === "/doctor"
      : pathname.startsWith(href.replace(/\/profile$/, ""));

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    router.push(
      q
        ? { pathname: "/doctor/patients", query: { q } }
        : "/doctor/patients",
    );
  }

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      // Hard navigation clears any cached RSC payload from the old session.
      window.location.assign("/login");
    }
  }

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* Sidebar */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label={t("menu")}
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-pine/50 backdrop-blur-sm lg:hidden"
        />
      ) : null}
      <aside
        role={drawerOpen ? "dialog" : undefined}
        aria-modal={drawerOpen ? "true" : undefined}
        aria-label={t("portal")}
        className={`fixed inset-y-0 start-0 z-50 flex h-dvh w-72 shrink-0 flex-col overflow-y-auto bg-brand text-white shadow-2xl transition-transform duration-300 print:hidden lg:sticky lg:top-0 lg:z-auto lg:w-64 lg:translate-x-0 lg:rtl:translate-x-0 lg:shadow-none ${
          drawerOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label={t("menu")}
          onClick={() => setDrawerOpen(false)}
          className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <span aria-hidden className="msym text-[21px]">close</span>
        </button>
        <Link href="/doctor" onClick={() => setDrawerOpen(false)} className="px-5 pt-6">
          <Image
            src="/brand/logo-banner-transparent.png"
            alt="Cannathera"
            width={220}
            height={62}
            className="h-auto w-52"
            priority
          />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {t("portal")}
          </p>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1 px-3" aria-label={t("portal")}>
          {NAV.filter(
            (item) =>
              can(item.perm) ||
              ("altPerm" in item && can((item as { altPerm: string }).altPerm)),
          ).map(({ href, key, icon }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(href)
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span aria-hidden className="msym text-[20px]">
                {icon}
              </span>
              <span>{t(`nav.${key}`)}</span>
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mx-3 mb-6 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden className="msym text-[20px]">
            logout
          </span>
          <span>{t("logout")}</span>
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-hairline bg-white px-3 py-3 print:hidden sm:gap-4 sm:px-6">
          <button
            type="button"
            aria-label={t("menu")}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-hairline text-pine hover:bg-surface lg:hidden"
          >
            <span aria-hidden className="msym text-[22px]">menu</span>
          </button>
          <form onSubmit={handleSearch} className="relative min-w-0 flex-1 lg:max-w-md" role="search">
            <span
              aria-hidden
              className="msym absolute start-3 top-1/2 -translate-y-1/2 text-[20px] text-muted"
            >
              search
            </span>
            <input
              ref={searchRef}
              type="search"
              placeholder={t("search")}
              aria-label={t("searchAction")}
              className="h-10 w-full rounded-full bg-[#eef1f8] ps-10 pe-4 text-sm text-ink-strong outline-none placeholder:text-muted focus:ring-2 focus:ring-pine-600/30"
            />
          </form>
          <div className="flex shrink-0 items-center gap-4">
            {/* Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label={t("notifications")}
                onClick={() => setBellOpen((v) => !v)}
                className="relative p-1"
              >
                <span aria-hidden className="msym text-[22px] text-ink-strong">
                  notifications
                </span>
                {alerts.length > 0 ? (
                  <span className="absolute -end-1 -top-1 flex size-4.5 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {alerts.length}
                  </span>
                ) : null}
              </button>
              {bellOpen ? (
                <>
                  <button
                    type="button"
                    aria-label={t("notifications")}
                    onClick={() => setBellOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="absolute end-0 top-10 z-40 w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden rounded-xl border border-hairline bg-white shadow-lg">
                    <p className="border-b border-hairline px-5 py-3 font-bold text-ink-strong">
                      {t("notifications")}
                    </p>
                    {alerts.length === 0 ? (
                      <p className="px-5 py-6 text-center text-sm text-muted">
                        {t("noNotifications")}
                      </p>
                    ) : (
                      alerts.map((a) => (
                        <Link
                          key={a.id}
                          href={`/doctor/patients/${a.patientId}`}
                          onClick={() => setBellOpen(false)}
                          className="flex items-start gap-3 border-b border-hairline px-5 py-3 last:border-0 hover:bg-surface"
                        >
                          <span
                            aria-hidden
                            className={`msym mt-0.5 text-[20px] ${
                              a.severity === "CRITICAL" ? "text-red-600" : "text-gold"
                            }`}
                          >
                            warning
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-ink-strong">
                              {a.patientName}
                            </span>
                            <span className="block text-xs leading-relaxed text-muted">
                              {a.message}
                            </span>
                          </span>
                        </Link>
                      ))
                    )}
                    <Link
                      href="/doctor/alerts"
                      onClick={() => setBellOpen(false)}
                      className="block bg-[#f6f8fc] px-5 py-3 text-center text-sm font-bold text-pine-600 hover:underline"
                    >
                      {t("openAlerts")}
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
            {/* Settings */}
            <Link href="/doctor/settings/profile" aria-label={t("settingsLabel")} className="hidden p-1 sm:block">
              <span aria-hidden className="msym text-[22px] text-ink-strong">
                settings
              </span>
            </Link>
            <div className="relative border-s border-hairline ps-4">
              <button
                type="button"
                aria-label={t("menu")}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-surface"
              >
                <span className="text-end max-sm:hidden">
                  <span className="block text-sm font-bold text-ink-strong">{userName}</span>
                  <span className="block text-xs text-muted">{t("doctorRole")}</span>
                </span>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served by the API origin
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${logoUrl}`}
                    alt=""
                    className="size-9 rounded-full border border-hairline bg-white object-contain"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-9 items-center justify-center rounded-full bg-pine-600 text-sm font-bold text-white"
                  >
                    {userName
                      .split(/\s+/)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    aria-label={t("menu")}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="absolute end-0 top-12 z-40 w-64 rounded-xl border border-hairline bg-white shadow-lg">
                    <p className="border-b border-hairline px-5 py-3 text-sm text-muted rounded-t-xl">
                      {userName}
                    </p>
                    <Link
                      href="/doctor/settings/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 border-b border-hairline px-5 py-3 text-sm font-semibold text-ink-strong hover:bg-surface"
                    >
                      <span aria-hidden className="msym text-[20px] text-pine-600">
                        settings
                      </span>
                      {t("myPractice")}
                    </Link>
                    <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
                      <span className="flex items-center gap-3 text-sm font-semibold text-ink-strong">
                        <span aria-hidden className="msym text-[20px] text-pine-600">
                          language
                        </span>
                        {t("language")}
                      </span>
                      <LocaleSwitcher />
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-semibold text-accent-print hover:bg-surface rounded-b-xl"
                    >
                      <span aria-hidden className="msym text-[20px]">
                        logout
                      </span>
                      {t("logout")}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6 print:p-0">{children}</main>
        <LiveNotifications />
      </div>
    </div>
  );
}
