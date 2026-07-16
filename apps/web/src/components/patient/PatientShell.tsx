"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { api, API_URL } from "@/lib/api";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { LiveNotifications } from "@/components/common/LiveNotifications";
import { QuickLogSheet } from "./QuickLogSheet";

export type Notification = {
  id: string;
  icon: string;
  title: string;
  text: string;
  href: string;
};

export type Branding = {
  partner: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  poweredBy: string;
};

const NAV = [
  { href: "/patient", key: "home", icon: "explore" },
  { href: "/patient/progress", key: "progress", icon: "monitoring" },
  { href: "/patient/appointments", key: "appointments", icon: "calendar_month" },
  { href: "/patient/profile", key: "profile", icon: "person" },
] as const;

/* Mobile app frame (Figma 6-385…6-1168): light header, phone-width column,
   dark-green pill bottom nav with orange FAB. Header + nav auto-hide on
   scroll down and reappear on scroll up. */
export function PatientShell({
  children,
  userName,
  notifications = [],
  branding = null,
}: Readonly<{
  children: React.ReactNode;
  userName: string;
  notifications?: Notification[];
  branding?: Branding | null;
}>) {
  const t = useTranslations("patient.nav");
  const th = useTranslations("patient.header");
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "notifications" | "menu">("none");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Auto-hide chrome while scrolling down; show again on scroll up.
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      if (y > 64 && goingDown) setHidden(true);
      else if (!goingDown || y <= 64) setHidden(false);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close any dropdown on navigation.
  useEffect(() => setPanel("none"), [pathname]);

  const initials = userName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      // Hard navigation clears any cached RSC payload from the old session.
      window.location.assign("/login");
    }
  }

  /* Co-branding: overriding the brand tokens on the wrapper re-themes the WHOLE
     patient app (rings, charts, buttons, nav), not just the header — every
     component already draws from these variables. */
  const theme = branding?.primaryColor
    ? ({
        "--color-pine": branding.primaryColor,
        "--color-pine-600": branding.primaryColor,
        "--color-brand": branding.primaryColor,
        ...(branding.accentColor
          ? {
              "--color-accent": branding.accentColor,
              "--color-orange-500": branding.accentColor,
            }
          : {}),
        ...(branding.fontFamily === "inter"
          ? { "--font-display": "var(--font-sans)" }
          : {}),
      } as React.CSSProperties)
    : undefined;

  const partnerName = branding?.partner ?? "Cannathera";
  const logoSrc = branding?.logoUrl ? `${API_URL}${branding.logoUrl}` : "/brand/logo.png";

  return (
    <div className="min-h-dvh bg-surface" style={theme}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col shadow-sm">
        {/* Header */}
        <header
          className={`sticky top-0 z-30 flex items-center justify-between bg-[#eef1f8] px-4 py-2.5
                      transition-transform duration-300 ${hidden ? "-translate-y-full" : ""}`}
        >
          <Link href="/patient" className="flex items-center gap-2" aria-label={t("home")}>
            {branding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoSrc}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full object-contain"
              />
            ) : (
              <Image
                src="/brand/logo.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full"
                priority
              />
            )}
            <span className="font-display text-xl font-bold text-pine">
              {partnerName}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={th("notifications")}
              onClick={() => setPanel(panel === "notifications" ? "none" : "notifications")}
              className="relative p-1"
            >
              <span aria-hidden className="msym text-[22px] text-ink-strong">
                notifications
              </span>
              {notifications.length > 0 ? (
                <span
                  className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center
                             rounded-full bg-accent text-[10px] font-bold text-white"
                >
                  {notifications.length}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label={th("menu")}
              onClick={() => setPanel(panel === "menu" ? "none" : "menu")}
              className="flex size-9 items-center justify-center rounded-full bg-pine-600
                         text-sm font-bold text-white"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Dropdown panels */}
        {panel !== "none" ? (
          <>
            <button
              type="button"
              aria-label={th("menu")}
              onClick={() => setPanel("none")}
              className="fixed inset-0 z-30 cursor-default bg-black/20"
            />
            <div className="fixed left-1/2 top-14 z-40 w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2">
              {panel === "notifications" ? (
                <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-lg">
                  <p className="border-b border-hairline px-5 py-3 font-bold text-ink-strong">
                    {th("notifications")}
                  </p>
                  {notifications.length === 0 ? (
                    <p className="px-5 py-6 text-center text-sm text-muted">
                      {th("noNotifications")}
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setPanel("none")}
                        className="flex items-start gap-3 border-b border-hairline px-5 py-4
                                   last:border-0 hover:bg-surface"
                      >
                        <span
                          aria-hidden
                          className="msym mt-0.5 flex size-9 shrink-0 items-center justify-center
                                     rounded-full bg-mint/30 text-[18px] text-pine-600"
                        >
                          {n.icon}
                        </span>
                        <span>
                          <span className="block font-bold text-ink-strong">{n.title}</span>
                          <span className="block text-sm text-muted">{n.text}</span>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-lg">
                  <p className="border-b border-hairline px-5 py-3 text-sm text-muted">
                    {userName}
                  </p>
                  <MenuLink href="/patient/profile" icon="person" label={th("myProfile")} />
                  <MenuLink href="/patient/forms" icon="assignment" label={th("myForms")} />
                  <MenuLink href="/patient/reports" icon="picture_as_pdf" label={th("myReports")} />
                  <MenuLink href="/patient/plan" icon="event_note" label={th("myPlan")} />
                  <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
                    <span className="flex items-center gap-3 text-ink-strong">
                      <span aria-hidden className="msym text-[20px] text-pine-600">
                        language
                      </span>
                      {th("language")}
                    </span>
                    <LocaleSwitcher />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-5 py-3 font-semibold
                               text-accent-print hover:bg-surface"
                  >
                    <span aria-hidden className="msym text-[20px]">
                      logout
                    </span>
                    {th("logout")}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Content */}
        <main className="flex-1 px-4 pt-4 pb-28">
          {children}

          {/* Co-branding rule: when a partner's brand is shown, the Cannathera
              mark must remain visible. It is never removable. */}
          {branding?.partner ? (
            <p className="mt-8 text-center text-xs font-semibold tracking-wide text-muted">
              {branding.poweredBy}
            </p>
          ) : null}
        </main>

        {/* Bottom nav + FAB */}
        <nav
          className={`fixed bottom-3 left-1/2 z-30 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2
                      transition-all duration-300 ${
                        hidden ? "translate-y-24 opacity-0 pointer-events-none" : ""
                      }`}
          aria-label="Navigation"
        >
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={t("quickLog")}
            className="absolute -top-6 left-1/2 z-10 flex size-14 -translate-x-1/2 items-center
                       justify-center rounded-full bg-accent text-white shadow-lg
                       ring-4 ring-surface transition-transform hover:scale-105"
          >
            <span aria-hidden className="msym text-[28px]">
              add
            </span>
          </button>
          <div className="flex items-center justify-between rounded-full bg-[#0c3527] px-6 py-2.5">
            {NAV.slice(0, 2).map(({ key, ...item }) => (
              <NavItem key={key} {...item} label={t(key)} active={pathname === item.href} />
            ))}
            <span className="w-12" aria-hidden />
            {NAV.slice(2).map(({ key, ...item }) => (
              <NavItem key={key} {...item} label={t(key)} active={pathname === item.href} />
            ))}
          </div>
        </nav>

        <QuickLogSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
        <LiveNotifications />
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: Readonly<{ href: string; icon: string; label: string }>) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-hairline px-5 py-3 text-ink-strong hover:bg-surface"
    >
      <span aria-hidden className="msym text-[20px] text-pine-600">
        {icon}
      </span>
      {label}
    </Link>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: Readonly<{ href: string; icon: string; label: string; active: boolean }>) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 text-[11px] ${
        active ? "text-white font-bold" : "text-white/60"
      }`}
    >
      <span aria-hidden className="msym text-[20px]">
        {icon}
      </span>
      {label}
    </Link>
  );
}
