"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/auth/BrandMark";
import { AdminSidebarNav, type AdminSection } from "./AdminSidebarNav";

type AdminShellLabels = {
  systemControl: string;
  systemAdmin: string;
  controlCenter: string;
  exit: string;
  menu: string;
  close: string;
  adminSections: string;
  sections: Record<AdminSection, string>;
};

export function AdminShell({
  children,
  userName,
  labels,
}: Readonly<{
  children: React.ReactNode;
  userName: string;
  labels: AdminShellLabels;
}>) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-hairline p-5">
        <div className="flex flex-col gap-2">
          <BrandMark size={32} />
          <span className="self-start rounded bg-mint/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine">
            {labels.systemControl}
          </span>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label={labels.close}
            className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-pine"
          >
            <span aria-hidden className="msym text-[20px]">close</span>
          </button>
        ) : null}
      </div>

      <AdminSidebarNav
        ariaLabel={labels.adminSections}
        labels={labels.sections}
        onNavigate={onNavigate}
      />

      <div className="border-t border-hairline p-4">
        <div className="truncate text-xs font-bold text-ink-strong">{userName}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
          {labels.systemAdmin}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className="hidden w-72 shrink-0 border-e border-hairline bg-white lg:flex lg:flex-col">
        {sidebarContent()}
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-pine/45 backdrop-blur-sm"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={labels.adminSections}
            className="absolute inset-y-0 start-0 flex w-[min(86vw,20rem)] flex-col bg-white shadow-2xl"
          >
            {sidebarContent(() => setDrawerOpen(false))}
          </aside>
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-hairline bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={labels.menu}
              aria-expanded={drawerOpen}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-hairline text-pine hover:bg-surface lg:hidden"
            >
              <span aria-hidden className="msym text-[22px]">menu</span>
            </button>
            <h1 className="truncate font-display text-lg font-bold text-pine">
              {labels.controlCenter}
            </h1>
          </div>
          <Link
            href="/login"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-muted hover:bg-surface hover:text-ink-strong"
          >
            <span aria-hidden className="msym text-[18px]">logout</span>
            <span className="hidden sm:inline">{labels.exit}</span>
          </Link>
        </header>
        <div className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
