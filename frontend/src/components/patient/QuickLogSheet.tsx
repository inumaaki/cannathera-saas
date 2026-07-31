"use client";

import { useEffect, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import useSWR from "swr";

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
  const [strain, setStrain] = useState("");
  const [pain, setPain] = useState(5);
  const [sleep, setSleep] = useState(8);
  const [activity, setActivity] = useState(4);

  // Fetch recent strains
  const { data: recentStrains = [] } = useSWR<string[]>(
    "/patient/strains",
    (url: string) => api(url) as Promise<string[]>
  );

  // New Clinical Parameters
  const [intakeTime, setIntakeTime] = useState("");
  const [consumptionMethod, setConsumptionMethod] = useState("Vaporizer");
  const [batchNumber, setBatchNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [sideEffects, setSideEffects] = useState<Record<string, string>>({}); // mapped to intensities
  const [benefitRating, setBenefitRating] = useState(5);
  const [benefitOnset, setBenefitOnset] = useState("15 - 30 min");
  const [benefitDuration, setBenefitDuration] = useState(
    locale === "de" ? "2 - 4 Std." : locale === "tr" ? "2 - 4 saat" : "2 - 4 hours"
  );
  const [note, setNote] = useState("");
  const [symptomsText, setSymptomsText] = useState("");
  const [effectDescription, setEffectDescription] = useState("");
  const [sideEffectsText, setSideEffectsText] = useState("");

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Set current time as default if empty
    if (!intakeTime) {
      const now = new Date();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntakeTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }

    const previousOverflow = document.body.style.overflow;
    // Fix mobile scroll bug: don't lock body overflow entirely on iOS, 
    // or use touch-action. We will allow normal modal scroll with touch scrolling.
    if (!window.navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, intakeTime]);

  if (!open) return null;

  async function handleSave() {
    setPending(true);
    try {
      await api("/patient/logs", {
        method: "POST",
        body: {
          dosageG: dosage,
          strain,
          batchNumber,
          manufacturer,
          consumptionMethod,
          pain,
          sleep,
          activity,
          intakeTime,
          sideEffects,
          benefitRating,
          benefitOnset,
          benefitDuration,
          symptomsText,
          effectDescription,
          sideEffectsText,
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
  function toggleSideEffect(effectKey: string, intensity: string) {
    setSideEffects((prev) => {
      const copy = { ...prev };
      if (copy[effectKey] === intensity) {
        delete copy[effectKey]; // toggle off if same intensity clicked again
      } else {
        copy[effectKey] = intensity; // set or change intensity
      }
      return copy;
    });
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
      <div
        style={{ WebkitOverflowScrolling: "touch" }}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[calc(100dvh-0.75rem)] w-full max-w-md
                   overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-4 pt-3 shadow-2xl
                   pb-[calc(1.5rem+env(safe-area-inset-bottom))]
                   sm:bottom-3 sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-3xl sm:px-6"
      >
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
        <div className="mt-2">
          <input
            type="time"
            value={intakeTime}
            onChange={(e) => setIntakeTime(e.target.value)}
            className="h-12 w-full rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
          />
        </div>

        {/* Consumption Method */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
          {t("consumptionMethodTitle")}
        </p>
        <div className="mt-2">
          <select
            value={consumptionMethod}
            onChange={(e) => setConsumptionMethod(e.target.value)}
            className="h-12 w-full rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
          >
            {["Vaporizer", "Inhalation", "Oral/Drops", "Tea", "Joint/Classic"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Strain / Consumption Type — Open Free Text Field */}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
          {t("strain")}
        </p>
        <div className="relative mt-2">
          <input
            type="text"
            value={strain}
            onChange={(e) => setStrain(e.target.value)}
            placeholder={locale === "de" ? "z. B. Bedrocan, Pedanios 22/1, Cannamedical..." : "e.g. Bedrocan, Pedanios 22/1..."}
            className="h-12 w-full rounded-lg border border-hairline bg-white px-4 text-base text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
          />
        </div>
        {recentStrains.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
              {t("recentStrains")}
            </p>
            <div className="flex flex-wrap gap-2">
              {recentStrains.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrain(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    strain === s
                      ? "bg-pine-600 border-pine-600 text-white"
                      : "bg-surface border-hairline text-ink-strong hover:bg-gray-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Batch Number & Manufacturer */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
              {t("batchNumberTitle")}
            </p>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder={t("batchNumberPlaceholder")}
              className="mt-2 h-12 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-strong">
              {t("manufacturerTitle")}
            </p>
            <input
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder={t("manufacturerPlaceholder")}
              className="mt-2 h-12 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>
        </div>

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

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
            {t("symptomsTextLabel")}
          </p>
          <hr className="mt-2 border-hairline" />
          <textarea
            value={symptomsText}
            onChange={(e) => setSymptomsText(e.target.value)}
            placeholder={t("symptomsTextPlaceholder")}
            rows={3}
            className="mt-3 w-full rounded-xl border border-hairline p-3 text-sm text-ink-strong outline-none focus:border-pine-600 min-h-[80px] bg-white resize-none"
          />
        </div>

        {/* Side Effects section */}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-sage-900">
          {t("sideEffectsTitle")}
        </p>
        <hr className="mt-2 border-hairline" />
        <div className="mt-3 flex flex-col gap-3">
          {[
            { id: "fatigue", label: t("sideEffectFatigue") },
            { id: "dizziness", label: t("sideEffectDizziness") },
            { id: "dry_mouth", label: t("sideEffectDryMouth") },
            { id: "heartbeat", label: t("sideEffectHeartbeat") },
          ].map((effect) => {
            const currentIntensity = sideEffects[effect.id];
            const isActive = !!currentIntensity;
            return (
              <div
                key={effect.id}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-hairline hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${isActive ? "text-orange-800" : "text-ink-strong"}`}>
                    {effect.label}
                  </span>
                  {isActive && (
                    <span aria-hidden className="msym text-[16px] text-orange-600">
                      warning
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {["mild", "moderate", "severe"].map((intensity) => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => toggleSideEffect(effect.id, intensity)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${
                        currentIntensity === intensity
                          ? "bg-orange-600 text-white shadow-sm"
                          : "bg-white text-ink-strong border border-hairline hover:bg-orange-100"
                      }`}
                    >
                      {t(`intensity_${intensity}`)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <textarea
          value={sideEffectsText}
          onChange={(e) => setSideEffectsText(e.target.value)}
          placeholder={t("sideEffectsTextPlaceholder")}
          rows={2}
          className="mt-3 w-full rounded-xl border border-hairline p-3 text-sm text-ink-strong outline-none focus:border-pine-600 min-h-[60px] bg-white resize-none"
        />

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

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
            {t("effectDescriptionLabel")}
          </p>
          <textarea
            value={effectDescription}
            onChange={(e) => setEffectDescription(e.target.value)}
            placeholder={t("effectDescriptionPlaceholder")}
            rows={3}
            className="w-full rounded-xl border border-hairline p-3 text-sm text-ink-strong outline-none focus:border-pine-600 min-h-[80px] bg-white resize-none"
          />
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
