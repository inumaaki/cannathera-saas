"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Link, useRouter } from "@/i18n/navigation";

const EFFECT_OPTIONS = [
  { id: "pain", label: "Schmerzlindernd", icon: "favorite" },
  { id: "euphoric", label: "Stimmungsaufhellend / Euphorisierend", icon: "sentiment_very_satisfied" },
  { id: "relax", label: "Körperlich entspannend", icon: "spa" },
  { id: "sleep", label: "Schlaffördernd", icon: "bedtime" },
  { id: "focus", label: "Fokussierend / Aktivierend", icon: "psychology" },
] as const;

function FeedbackContent() {
  const t = useTranslations("patient.feedback");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pharmacies, setPharmacies] = useState<Array<{ id: string; name: string; city?: string | null }>>([]);
  const [recentStrains, setRecentStrains] = useState<string[]>([]);

  // Form state
  const [pharmacyId, setPharmacyId] = useState(searchParams.get("pharmacyId") || "");
  const [strain, setStrain] = useState(searchParams.get("strain") || "");
  const [benefitRating, setBenefitRating] = useState<number>(5); // 1-5
  const [wouldBuyAgain, setWouldBuyAgain] = useState<boolean>(true);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([
    "Schmerzlindernd",
    "Körperlich entspannend",
  ]);
  const [symptomsText, setSymptomsText] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available pharmacies and recent strains
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, searchRes, strainsRes] = await Promise.all([
          api<{ favoritePharmacies: Array<{ id: string; name: string; city: string | null }> }>("/patient/profile").catch(() => null),
          api<Array<{ id: string; name: string; city: string }>>("/patient/pharmacies/search").catch(() => []),
          api<string[]>("/patient/strains").catch(() => []),
        ]);

        const favs = profileRes?.favoritePharmacies || [];
        const combined = [...favs];
        const existingIds = new Set(favs.map((f) => f.id));
        (searchRes || []).forEach((p) => {
          if (!existingIds.has(p.id)) combined.push(p);
        });

        setPharmacies(combined);
        setRecentStrains(strainsRes || []);

        if (!pharmacyId && combined.length > 0) {
          setPharmacyId(combined[0].id);
        }
        if (!strain && strainsRes && strainsRes.length > 0) {
          setStrain(strainsRes[0]);
        }
      } catch (err) {
        console.error("Failed to load feedback options:", err);
      }
    }
    loadData();
  }, []);

  function toggleEffect(label: string) {
    if (selectedEffects.includes(label)) {
      setSelectedEffects(selectedEffects.filter((e) => e !== label));
    } else {
      setSelectedEffects([...selectedEffects, label]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyId) {
      setError("Bitte wählen Sie eine Apotheke aus.");
      return;
    }
    if (!strain.trim()) {
      setError("Bitte geben Sie die bewertete Sorte an.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api("/patient/strain-feedback", {
        method: "POST",
        body: {
          pharmacyId,
          strain: strain.trim(),
          benefitRating,
          wouldBuyAgain,
          effectDescription: selectedEffects.join(", ") || "Keine spezifischen Angaben",
          symptomsText: symptomsText.trim() || "Chronische Beschwerden",
          note: note.trim() || undefined,
        },
      });
      setSubmitted(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Feedback konnte nicht übermittelt werden.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedPharmacy = pharmacies.find((p) => p.id === pharmacyId);

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <span aria-hidden className="msym text-4xl">check_circle</span>
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold text-pine-900">
            {t("successTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {t("successDesc")}
          </p>

          <div className="mt-6 rounded-2xl bg-[#f6f8fc] p-4 text-left text-xs text-ink-strong space-y-1.5 border border-hairline">
            <p>
              <span className="font-semibold text-muted">Apotheke:</span>{" "}
              {selectedPharmacy?.name ?? "Partner-Apotheke"}
            </p>
            <p>
              <span className="font-semibold text-muted">Bewertete Sorte:</span> {strain}
            </p>
            <p>
              <span className="font-semibold text-muted">Bewertung:</span> {benefitRating} / 5 Sterne (
              {benefitRating >= 3.5 ? "Gut" : "Ungenügend"})
            </p>
            <p>
              <span className="font-semibold text-muted">Wiederkauf:</span>{" "}
              {wouldBuyAgain ? "Ja, würde ich wieder nehmen" : "Nein"}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/patient/inventory?pharmacyId=${pharmacyId}`}
              className="h-11 px-6 rounded-xl bg-pine-600 font-bold text-sm text-white hover:bg-pine-700 flex items-center justify-center gap-2 shadow-sm"
            >
              <span aria-hidden className="msym text-[18px]">storefront</span>
              {t("backToShop")}
            </Link>

            <Link
              href="/patient"
              className="h-11 px-6 rounded-xl border border-hairline font-bold text-sm text-ink-strong hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <span aria-hidden className="msym text-[18px]">home</span>
              {t("backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted mb-1">
          <Link href="/patient" className="hover:text-pine-600">
            Start
          </Link>
          <span>/</span>
          <span className="text-ink-strong font-medium">Sorten-Feedback</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-pine-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {/* Main Feedback Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-hairline bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* 1. Recipient Pharmacy */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            {t("pharmacyLabel")}
          </label>
          <select
            value={pharmacyId}
            onChange={(e) => setPharmacyId(e.target.value)}
            className="h-12 w-full rounded-xl border border-hairline bg-[#f6f8fc] px-4 text-sm font-medium text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
            required
          >
            <option value="" disabled>
              {t("pharmacySelect")}
            </option>
            {pharmacies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.city ? `(${p.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Strain Selection & Quick Picks */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            {t("strainLabel")}
          </label>
          <input
            type="text"
            value={strain}
            onChange={(e) => setStrain(e.target.value)}
            placeholder={t("strainPlaceholder")}
            className="h-12 w-full rounded-xl border border-hairline bg-[#f6f8fc] px-4 text-sm font-medium text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
            required
          />

          {recentStrains.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted font-medium">Aus Ihren letzten Einnahmen:</span>
              {recentStrains.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrain(s)}
                  className="rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-pine-800"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Overall Rating / Satisfaction (1-5 stars) */}
        <div className="border-t border-hairline pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            {t("ratingLabel")}
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setBenefitRating(star)}
                className={`size-12 rounded-xl flex items-center justify-center transition-all ${
                  benefitRating >= star
                    ? "bg-amber-400 text-white shadow-sm scale-105"
                    : "bg-[#f6f8fc] text-slate-300 hover:text-amber-300"
                }`}
              >
                <span aria-hidden className="msym text-2xl">star</span>
              </button>
            ))}
            <span className="ml-3 text-sm font-bold text-ink-strong">
              {benefitRating >= 4
                ? "Sehr gut & wirksam"
                : benefitRating === 3
                  ? "Mäßig wirksam"
                  : "Ungenügend / Nicht passend"}
            </span>
          </div>
        </div>

        {/* 4. Would buy again? */}
        <div className="border-t border-hairline pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-3">
            {t("wouldBuyAgainLabel")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setWouldBuyAgain(true)}
              className={`h-12 rounded-xl border px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                wouldBuyAgain
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20"
                  : "border-hairline bg-white text-ink-strong hover:bg-slate-50"
              }`}
            >
              <span aria-hidden className="msym text-emerald-600 text-[20px]">thumb_up</span>
              {t("wouldBuyAgainYes")}
            </button>

            <button
              type="button"
              onClick={() => setWouldBuyAgain(false)}
              className={`h-12 rounded-xl border px-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                !wouldBuyAgain
                  ? "border-red-500 bg-red-50 text-red-800 ring-2 ring-red-500/20"
                  : "border-hairline bg-white text-ink-strong hover:bg-slate-50"
              }`}
            >
              <span aria-hidden className="msym text-red-600 text-[20px]">thumb_down</span>
              {t("wouldBuyAgainNo")}
            </button>
          </div>
        </div>

        {/* 5. Perceived Effects Multi-select */}
        <div className="border-t border-hairline pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-3">
            {t("effectsLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {EFFECT_OPTIONS.map((eff) => {
              const active = selectedEffects.includes(eff.label);
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => toggleEffect(eff.label)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? "bg-pine-600 text-white shadow-sm ring-2 ring-pine-600/20"
                      : "bg-[#f6f8fc] text-ink-strong hover:bg-slate-200 border border-hairline"
                  }`}
                >
                  <span aria-hidden className="msym text-[16px]">
                    {eff.icon}
                  </span>
                  <span>{eff.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Symptoms Relief Text */}
        <div className="border-t border-hairline pt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            {t("symptomsLabel")}
          </label>
          <input
            type="text"
            value={symptomsText}
            onChange={(e) => setSymptomsText(e.target.value)}
            placeholder={t("symptomsPlaceholder")}
            className="h-12 w-full rounded-xl border border-hairline bg-[#f6f8fc] px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
          />
        </div>

        {/* 7. Free Text Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
            {t("noteLabel")}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={t("notePlaceholder")}
            className="w-full rounded-xl border border-hairline bg-[#f6f8fc] p-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-xl bg-pine-600 font-bold text-white shadow-md hover:bg-pine-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span aria-hidden className="msym animate-spin text-[20px]">
                progress_activity
              </span>
              {t("submitting")}
            </>
          ) : (
            <>
              <span aria-hidden className="msym text-[20px]">send</span>
              {t("submit")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function PatientFeedbackPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Wird geladen …</div>}>
      <FeedbackContent />
    </Suspense>
  );
}
