"use client";

import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { slug: "profile", icon: "account_circle", perm: "settings:practice" },
  { slug: "team", icon: "group_add", perm: "settings:team" },
  { slug: "notifications", icon: "notifications", perm: "settings:practice" },
  { slug: "compliance", icon: "verified_user", perm: "compliance:view" },
  { slug: "integrations", icon: "hub", perm: "settings:practice" },
] as const;

type Slug = (typeof ITEMS)[number]["slug"];

export function SettingsNav({
  labels,
  permissions,
}: Readonly<{ labels: Record<Slug, string>; permissions: string[] }>) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => permissions.includes(i.perm));

  return (
    <nav className="space-y-1">
      {visible.map(({ slug, icon }) => {
        const href = `/doctor/settings/${slug}`;
        const active = pathname === href;
        return (
          <Link
            key={slug}
            href={href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold ${
              active
                ? "bg-[#eef1f8] text-ink-strong"
                : "text-muted hover:bg-surface hover:text-ink-strong"
            }`}
          >
            <span className="flex items-center gap-3">
              <span aria-hidden className="msym text-[20px]">
                {icon}
              </span>
              {labels[slug]}
            </span>
            {active ? (
              <span aria-hidden className="msym text-[16px] rtl:-scale-x-100">
                chevron_right
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
