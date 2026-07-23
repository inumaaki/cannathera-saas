"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

const STRAINS = ["Blue Dream (Hybrid)", "Bedrocan (Sativa)", "Pedanios 22/1"];

/* Quick Log bottom sheet (Figma 6-558): dosage stepper, strain select,
   three 0-10 sliders, plus professional clinical parameters, save -> POST /patient/logs. */
export function QuickLogSheet({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useTranslations("patient.quickLog");
  const locale = useLocale();
  const router = useRouter();

  // Core metrics
  const [dosage, setDosage] = useState(0.5);
  const [strain, setStrain] = useState(STRAINS[0]);
  const [pain, setPain] = useState(5);
  const [sleep, setSleep] = useState(8);
  const [activity, setActivity] = useState(4);

  // New Clinical Parameters
  const [intakeTime, setIntakeTime] = useState("morgens");
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [benefitRating, setBenefitRating] = useState(5);
  const [benefitOnset, setBenefitOnset] = useState("15 - 30 min");
  const [benefitDuration, setBenefitDuration] = useState(
    locale === "de" ? "2 - 4 Std." : locale === "tr" ? "2 - 4 saat" : "2 - 4 hours"
  );
  const [note, setNote] = useState("");

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  async function handleSave() {
    setPending(true);
    try {
      await api("/patient/logs", {
        method: "POST",
        body: {
          dosageG: dosage,
          strain,
          pain,
          sleep,
          activity,
          intakeTime,
          sideEffects,
          benefitRating,
          benefitOnset,
          benefitDuration,
          note,
        },
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

  // Handle side effect toggles
  function toggleSideEffect(effectKey: string) {
    setSideEffects((prev) =>
      prev.includes(effectKey)
        ? prev.filter((x) => x !== effectKey)
        : [...prev, effectKey]
    );
  }

  const durationOptions =
    locale === "de"
      ? ["< 2 Std.", "2 - 4 Std.", "4 - 6 Std.", "> 6 Std."]
      : locale === "tr"
      ? ["< 2 saat", "2 - 4 saat", "4 - 6 saat", "> 6 saat"]
      : ["< 2 hours", "2 - 4 hours", "4 - 6 hours", "> 6 hours"];

  const onsetOptions = ["< 15 min", "15 - 30 min", "30 - 60 min", "> 60 min"];

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={t("title")}>
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-6 pb-6 pt-3 shadow-2xl">
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

        {/* Time of intake */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
          {t("intakeTimeTitle")}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[
            { id: "morgens", label: t("intakeTimeMorning") },
            { id: "mittags", label: t("intakeTimeNoon") },
            { id: "abends", label: t("intakeTimeEvening") },
            { id: "bedarf", label: t("intakeTimeNeeded") },
          ].map((time) => {
            const isSelected = intakeTime === time.id;
            return (
              <button
                key={time.id}
                type="button"
                onClick={() => setIntakeTime(time.id)}
                className={`py-2 rounded-xl text-center text-xs font-bold border transition-all select-none ${
                  isSelected
                    ? "bg-pine text-white border-pine shadow-sm"
                    : "bg-white text-ink-strong border-hairline hover:bg-surface"
                }`}
              >
                {time.label}
              </button>
            );
          })}
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

        {/* Sliders (Vitals & Sentiment) */}
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

        {/* Side Effects section */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
          {t("sideEffectsTitle")}
        </p>
        <hr className="mt-2 border-hairline" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { id: "fatigue", label: t("sideEffectFatigue") },
            { id: "dizziness", label: t("sideEffectDizziness") },
            { id: "dry_mouth", label: t("sideEffectDryMouth") },
            { id: "heartbeat", label: t("sideEffectHeartbeat") },
          ].map((effect) => {
            const isSelected = sideEffects.includes(effect.id);
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => toggleSideEffect(effect.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? "bg-orange-50 border-orange-200 text-orange-800 shadow-sm"
                    : "bg-white border-hairline text-ink-strong hover:bg-surface"
                }`}
              >
                <span>{effect.label}</span>
                {isSelected && (
                  <span aria-hidden className="msym text-[14px] text-orange-600">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Effect & Benefit Section */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
          {t("benefitTitle")}
        </p>
        <hr className="mt-2 border-hairline" />
        <SliderRow
          label={t("benefitRatingLabel")}
          low={t("benefitRatingLow")}
          high={t("benefitRatingHigh")}
          value={benefitRating}
          onChange={setBenefitRating}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t("benefitOnsetLabel")}
            </label>
            <select
              value={benefitOnset}
              onChange={(e) => setBenefitOnset(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-ink-strong outline-none focus:border-pine-600"
            >
              {onsetOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t("benefitDurationLabel")}
            </label>
            <select
              value={benefitDuration}
              onChange={(e) => setBenefitDuration(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-hairline bg-white px-3 text-xs text-ink-strong outline-none focus:border-pine-600"
            >
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Free text comments */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
          {t("noteLabel")}
        </p>
        <hr className="mt-2 border-hairline" />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("notePlaceholder")}
          rows={3}
          className="mt-2 w-full rounded-xl border border-hairline p-3 text-sm text-ink-strong outline-none focus:border-pine-600 min-h-[80px] bg-white resize-none"
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-pine-600
                     text-base font-bold text-white disabled:opacity-60 transition-all active:scale-[0.99]"
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
        <p className="font-bold text-ink-strong text-sm">{label}</p>
        <p className="text-base font-bold text-pine-600">{value}</p>
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
