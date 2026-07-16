"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type ItemLabels = Record<string, { title: string; text: string }>;

const CLINICAL = ["redFlags", "newLogs", "apptReminders"] as const;
const SYSTEM = ["dailySummaries", "securityAlerts"] as const;
const DEFAULTS: Record<string, boolean> = {
  redFlags: true,
  newLogs: true,
  apptReminders: false,
  dailySummaries: true,
  securityAlerts: true,
};

export function NotificationToggles({
  initial,
  labels,
}: Readonly<{
  initial: Record<string, boolean>;
  labels: {
    clinicalAlerts: string;
    realtime: string;
    background: string;
    systemNotifs: string;
    save: string;
    saved: string;
    items: ItemLabels;
  };
}>) {
  const [state, setState] = useState<Record<string, boolean>>({
    ...DEFAULTS,
    ...initial,
  });
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setPending(true);
    setSaved(false);
    try {
      await api("/doctor/practice", {
        method: "PATCH",
        body: { branding: { notifications: state } },
      });
      setSaved(true);
    } finally {
      setPending(false);
    }
  }

  const group = (title: string, badge: string, keys: readonly string[]) => (
    <section className="overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="flex items-center justify-between bg-[#eef2fe] px-6 py-3">
        <p className="font-bold text-ink-strong">{title}</p>
        <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-info">
          {badge}
        </span>
      </div>
      {keys.map((key) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 border-t border-hairline px-6 py-4"
        >
          <div>
            <p className="font-bold text-ink-strong">{labels.items[key].title}</p>
            <p className="mt-0.5 max-w-2xl text-sm text-muted">{labels.items[key].text}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state[key]}
            aria-label={labels.items[key].title}
            onClick={() => setState((s) => ({ ...s, [key]: !s[key] }))}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              state[key] ? "bg-pine-600" : "bg-hairline"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-1 size-5 rounded-full bg-white transition-all ${
                state[key] ? "start-6" : "start-1"
              }`}
            />
          </button>
        </div>
      ))}
    </section>
  );

  return (
    <div className="space-y-5">
      {group(labels.clinicalAlerts, labels.realtime, CLINICAL)}
      {group(labels.systemNotifs, labels.background, SYSTEM)}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-lg bg-brand px-6 font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          <span aria-hidden className="msym text-[18px]">
            save
          </span>
          {saved ? labels.saved : labels.save}
        </button>
      </div>
    </div>
  );
}
