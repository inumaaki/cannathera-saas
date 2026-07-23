"use client";

import { useEffect, useState } from "react";

export type AdminSection = "partners" | "users" | "plans" | "logs";

const SECTIONS: Array<{ id: AdminSection; icon: string }> = [
  { id: "partners", icon: "corporate_fare" },
  { id: "users", icon: "people" },
  { id: "plans", icon: "payments" },
  { id: "logs", icon: "history_toggle_off" },
];

function sectionFromUrl(): AdminSection {
  if (typeof window === "undefined") return "partners";
  const value = new URLSearchParams(window.location.search).get("tab");
  return SECTIONS.some((section) => section.id === value)
    ? (value as AdminSection)
    : "partners";
}

export function AdminSidebarNav({
  labels,
  ariaLabel,
  onNavigate,
}: Readonly<{
  labels: Record<AdminSection, string>;
  ariaLabel: string;
  onNavigate?: () => void;
}>) {
  const [active, setActive] = useState<AdminSection>("partners");

  useEffect(() => {
    const syncFromUrl = () => setActive(sectionFromUrl());
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("admin-section-change", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("admin-section-change", syncFromUrl);
    };
  }, []);

  function selectSection(section: AdminSection) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", section);
    window.history.pushState({}, "", url);
    setActive(section);
    window.dispatchEvent(new Event("admin-section-change"));
    onNavigate?.();
  }

  return (
    <nav className="flex-1 space-y-1.5 p-4" aria-label={ariaLabel}>
      {SECTIONS.map((section) => {
        const selected = active === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => selectSection(section.id)}
            aria-current={selected ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl border-s-4 px-3 py-3 text-start text-sm font-bold transition-colors ${
              selected
                ? "border-brand bg-mint/20 text-pine"
                : "border-transparent text-muted hover:bg-surface hover:text-pine"
            }`}
          >
            <span aria-hidden className="msym text-[20px]">
              {section.icon}
            </span>
            <span>{labels[section.id]}</span>
          </button>
        );
      })}
    </nav>
  );
}
