"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { LiveNotifications } from "@/components/common/LiveNotifications";

const NAV = [
  { href: "/pharmacy", key: "dashboard", icon: "dashboard" },
  { href: "/pharmacy/reviews", key: "reviews", icon: "rate_review" },
  { href: "/pharmacy/logs", key: "logs", icon: "clinical_notes" },
  { href: "/pharmacy/analytics", key: "analytics", icon: "monitoring" },
  { href: "/pharmacy/inventory", key: "inventory", icon: "inventory_2" },
] as const;

export type Notice = {
  id: string;
  icon: string;
  tone: "critical" | "warning";
  text: string;
  href: string;
};

/* Pharmacy Portal frame (Figma 6.x): dark-green sidebar, DSGVO chip in topbar. */
export function PharmacyShell({
  children,
  userName,
  pharmacyName,
  notices,
}: Readonly<{
  children: React.ReactNode;
  userName: string;
  pharmacyName: string;
  notices: Notice[];
}>) {
  const t = useTranslations("pharmacy.shell");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/pharmacy" ? pathname === "/pharmacy" : pathname.startsWith(href);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    router.push(q ? { pathname: "/pharmacy/logs", query: { q } } : "/pharmacy/logs");
  }

  async function handleLogout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col bg-brand text-white max-lg:w-16 print:hidden">
        <Link href="/pharmacy" className="px-5 pt-6 max-lg:px-3">
          <Image
            src="/brand/logo-banner-transparent.png"
            alt="Cannathera"
            width={220}
            height={62}
            className="h-auto w-52 max-lg:hidden"
            priority
          />
          <Image
            src="/brand/logo.png"
            alt="Cannathera"
            width={40}
            height={40}
            className="hidden rounded-full max-lg:block"
            priority
          />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 max-lg:hidden">
            {t("portal")}
          </p>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1 px-3" aria-label={t("portal")}>
          {NAV.map(({ href, key, icon }) => (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive(href)
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span aria-hidden className="msym text-[20px]">
                {icon}
              </span>
              <span className="max-lg:hidden">{t(`nav.${key}`)}</span>
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
          <span className="max-lg:hidden">{t("logout")}</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-white px-6 py-3 print:hidden">
          <form onSubmit={handleSearch} className="relative w-full max-w-md" role="search">
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
              className="h-10 w-full rounded-full bg-[#eef1f8] ps-10 pe-4 text-sm text-ink-strong outline-none placeholder:text-muted focus:ring-2 focus:ring-pine-600/30"
            />
          </form>

          <div className="flex shrink-0 items-center gap-4">
            <span className="flex items-center gap-1.5 rounded-full bg-mint/25 px-3 py-1.5 text-xs font-bold uppercase text-pine max-md:hidden">
              <span aria-hidden className="msym text-[16px]">
                verified_user
              </span>
              {t("gdpr")}
            </span>

            <div className="relative">
              <button
                type="button"
                aria-label={t("notifications")}
                onClick={() => setBellOpen((v) => !v)}
                className="relative flex size-10 items-center justify-center rounded-lg text-ink-strong hover:bg-surface"
              >
                <span aria-hidden className="msym text-[22px]">
                  notifications
                </span>
                {notices.length > 0 ? (
                  <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-accent-print text-[10px] font-bold text-white">
                    {notices.length}
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
                  <div className="absolute end-0 top-12 z-40 w-80 overflow-hidden rounded-xl border border-hairline bg-white shadow-lg">
                    <p className="border-b border-hairline px-5 py-3 text-sm font-bold text-ink-strong">
                      {t("notifications")}
                    </p>
                    {notices.length === 0 ? (
                      <p className="px-5 py-6 text-center text-sm text-muted">
                        {t("noNotifications")}
                      </p>
                    ) : (
                      <ul>
                        {notices.map((n) => (
                          <li key={`${n.icon}-${n.id}`}>
                            <Link
                              href={n.href}
                              onClick={() => setBellOpen(false)}
                              className="flex gap-3 border-b border-hairline px-5 py-3 last:border-0 hover:bg-surface"
                            >
                              <span
                                aria-hidden
                                className={`msym text-[20px] ${
                                  n.tone === "critical"
                                    ? "text-red-600"
                                    : "text-accent-print"
                                }`}
                              >
                                {n.icon}
                              </span>
                              <span className="text-sm leading-snug text-ink-strong">
                                {n.text}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="relative border-s border-hairline ps-4">
              <button
                type="button"
                aria-label={t("menu")}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-surface"
              >
                <span className="text-end max-sm:hidden">
                  <span className="block text-sm font-bold text-ink-strong">{userName}</span>
                  <span className="block text-xs text-muted">{t("role")}</span>
                </span>
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
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    aria-label={t("menu")}
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="absolute end-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-hairline bg-white shadow-lg">
                    <p className="border-b border-hairline px-5 py-3 text-sm text-muted">
                      {pharmacyName}
                    </p>
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
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-semibold text-accent-print hover:bg-surface"
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

        <main className="flex-1 p-6">{children}</main>
        <LiveNotifications />
      </div>
    </div>
  );
}
