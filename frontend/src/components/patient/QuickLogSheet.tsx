"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

const STRAINS = ["Blue Dream (Hybrid)", "Bedrocan (Sativa)", "Pedanios 22/1"];

/* Quick Log bottom sheet (Figma 6-558): dosage stepper, strain select,
   three 0-10 sliders, save -> POST /patient/logs. */
export function QuickLogSheet({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useTranslations("patient.quickLog");
  const router = useRouter();
  const [dosage, setDosage] = useState(0.5);
  const [strain, setStrain] = useState(STRAINS[0]);
  const [pain, setPain] = useState(5);
  const [sleep, setSleep] = useState(8);
  const [activity, setActivity] = useState(4);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  async function handleSave() {
    setPending(true);
    try {
      await api("/patient/logs", {
        method: "POST",
        body: { dosageG: dosage, strain, pain, sleep, activity },
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
        router.refresh();
      }, 900);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={t("title")}>
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-6 pb-6 pt-3">
        <div aria-hidden className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-hairline" />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-pine">{t("title")}</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-sage-900">
              {t("subtitle")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} className="p-1 text-ink-strong">
            <span aria-hidden className="msym">
              close
            </span>
          </button>
        </div>

        <hr className="mt-4 border-hairline" />

        {/* Dosage stepper */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
          {t("dosage")}
        </p>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-info/20 bg-[#eef2fe] p-3">
          <button
            type="button"
            aria-label={t("decrease")}
            onClick={() => setDosage((d) => Math.max(0, Math.round((d - 0.05) * 100) / 100))}
            className="flex size-12 items-center justify-center rounded-lg border border-hairline bg-white text-xl font-bold text-ink-strong"
          >
            −
          </button>
          <p className="font-mono text-3xl font-bold text-ink-strong">
            {dosage.toFixed(2)} <span className="text-sm">g</span>
          </p>
          <button
            type="button"
            aria-label={t("increase")}
            onClick={() => setDosage((d) => Math.min(10, Math.round((d + 0.05) * 100) / 100))}
            className="flex size-12 items-center justify-center rounded-lg border border-hairline bg-white text-xl font-bold text-ink-strong"
          >
            +
          </button>
        </div>

        {/* Strain */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
          {t("strain")}
        </p>
        <select
          value={strain}
          onChange={(e) => setStrain(e.target.value)}
          className="mt-2 h-12 w-full rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong outline-none focus:border-pine-600"
        >
          {STRAINS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* Sliders */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
          {t("vitals")}
        </p>
        <hr className="mt-2 border-hairline" />

        <SliderRow label={t("pain")} low={t("painLow")} high={t("painHigh")} value={pain} onChange={setPain} />
        <SliderRow label={t("sleep")} low={t("sleepLow")} high={t("sleepHigh")} value={sleep} onChange={setSleep} />
        <SliderRow
          label={t("activity")}
          low={t("activityLow")}
          high={t("activityHigh")}
          value={activity}
          onChange={setActivity}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-pine-600
                     text-base font-bold text-white disabled:opacity-60"
        >
          <span aria-hidden className="msym text-[20px]">
            save
          </span>
          {saved ? t("saved") : t("save")}
        </button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  low,
  high,
  value,
  onChange,
}: Readonly<{
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}>) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <p className="font-bold text-ink-strong">{label}</p>
        <p className="text-lg font-bold text-pine-600">{value}</p>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full accent-(--color-orange-500)"
      />
      <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
