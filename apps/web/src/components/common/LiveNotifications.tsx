"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useLiveNotifications } from "@/lib/useLiveNotifications";

const TONE: Record<string, string> = {
  critical: "border-red-600 bg-red-50 text-red-600",
  warning: "border-gold bg-[#fdf6e3] text-gold",
  info: "border-pine-600 bg-mint/20 text-pine-600",
};

/**
 * Live alert toasts, mounted once per portal shell. The bell's own counts are
 * server-rendered; this component refreshes them as events land, so the badge
 * and the toast never disagree.
 */
export function LiveNotifications() {
  const t = useTranslations("common.live");
  const { live, connected, icon, dismiss } = useLiveNotifications();

  return (
    <>
      {/* Connection state, so a dead stream is visible rather than silent. */}
      <span
        aria-hidden
        title={connected ? t("connected") : t("reconnecting")}
        className={`fixed bottom-3 start-3 z-40 size-2 rounded-full print:hidden ${
          connected ? "bg-pine-600/40" : "bg-gold"
        }`}
      />

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-full max-w-sm flex-col gap-2 print:hidden"
      >
        {live.map((e) => (
          <div
            key={e.at}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border-s-4 bg-white p-4 shadow-lg ${
              TONE[e.severity] ?? TONE.info
            }`}
          >
            <span aria-hidden className="msym mt-0.5 text-[22px]">
              {icon(e.kind)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink-strong">{e.title}</p>
              <p className="text-sm leading-snug text-muted">{e.text}</p>
              {e.href ? (
                <Link
                  href={e.href}
                  onClick={() => dismiss(e.at)}
                  className="mt-1 inline-block text-xs font-bold text-pine-600 hover:underline"
                >
                  {t("open")}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={t("dismiss")}
              onClick={() => dismiss(e.at)}
              className="shrink-0 text-muted hover:text-ink-strong"
            >
              <span aria-hidden className="msym text-[18px]">
                close
              </span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
