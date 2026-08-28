 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

function SliderField({ label, value, onChange, minLabel = "Low", maxLabel = "High" }: { label: string, value: number, onChange: (v: number) => void, minLabel?: string, maxLabel?: string }) {
  return (
    <div className="mb-4 rounded-xl border border-hairline p-4">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-bold text-ink-strong">{label}</label>
        <span className="rounded bg-pine-100 px-2 py-1 text-sm font-bold text-pine-800">{value} / 10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-pine-600"
      />
      <div className="mt-1 flex justify-between text-xs text-sage-500 font-medium">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export default function PatientOnboarding() {
  const router = useRouter();
  const t = useTranslations("patient.onboarding");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  
  const [mainComplaints, setMainComplaints] = useState<string[]>([]);
  const [complaintsDescription, setComplaintsDescription] = useState("");
  
  const [therapyGoals, setTherapyGoals] = useState<string[]>([]);

  // Step 4: Symptom Baseline
  const [painIntensity, setPainIntensity] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [symptomBurden, setSymptomBurden] = useState(5);

  // Step 5: Daily Life and Resource Baseline
  const [dailyStructure, setDailyStructure] = useState(5);
  const [personalMotivation, setPersonalMotivation] = useState(5);
  const [adherence, setAdherence] = useState(5);
  const [selfOrganization, setSelfOrganization] = useState(5);
  const [qualityOfLife, setQualityOfLife] = useState(5);

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      
      await api("/patient/onboarding", {
        method: "POST",
        body: {
          address,
          phone,
          mainComplaints,
          complaintsDescription,
          therapyGoals,
          baselineMetrics: {
            painIntensity,
            sleepQuality,
            stressLevel,
            symptomBurden,
            dailyStructure,
            personalMotivation,
            adherence,
            selfOrganization,
            qualityOfLife
          }
        },
      });
      
      router.push("/patient");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = address.trim() !== "" && phone.trim() !== "";
  const isStep2Valid = mainComplaints.length > 0 && complaintsDescription.trim() !== "";
  const isStep3Valid = therapyGoals.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-strong">
          Initial Assessment
        </h1>
        <p className="mt-2 text-sage-900">
          Step {step} of 5
        </p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? "bg-pine-600" : "bg-hairline"}`} />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{t("masterData")}</h2>
            <p className="text-sm text-sage-900 mt-1">{t("masterDataDesc")}</p>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-ink-strong">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, House Number, Zip Code, City"
              className="w-full rounded-xl border border-hairline px-4 py-3 outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-ink-strong">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 123 456789"
              className="w-full rounded-xl border border-hairline px-4 py-3 outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>

          <button
            onClick={nextStep}
            disabled={!isStep1Valid}
            className="w-full rounded-xl bg-pine-600 py-4 font-bold text-white transition-all hover:bg-pine-700 disabled:opacity-50"
          >
            Continue to Medical Details
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{t("mainComplaints")}</h2>
            <p className="text-sm text-sage-900 mt-1">{t("mainComplaintsDesc")}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["Chronic Pain", "Sleep Disorders", "ADHD", "Depression", "Migraine", "Spasticity", "Loss of Appetite", "Other"].map((complaint) => (
              <button
                key={complaint}
                onClick={() => toggleArrayItem(setMainComplaints, complaint)}
                className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                  mainComplaints.includes(complaint)
                    ? "border-pine-600 bg-pine-50 text-pine-800 shadow-sm"
                    : "border-hairline bg-white text-ink-strong hover:bg-surface"
                }`}
              >
                {complaint}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-ink-strong">
              {t("descriptionOfComplaints")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={complaintsDescription}
              onChange={(e) => setComplaintsDescription(e.target.value)}
              placeholder="Please describe your symptoms in detail, including how long you've had them..."
              rows={4}
              className="w-full rounded-xl border border-hairline p-4 outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="w-1/3 rounded-xl border border-hairline bg-white py-4 font-bold text-ink-strong transition-all hover:bg-surface"
            >
              {t("back")}
            </button>
            <button
              onClick={nextStep}
              disabled={!isStep2Valid}
              className="w-2/3 rounded-xl bg-pine-600 py-4 font-bold text-white transition-all hover:bg-pine-700 disabled:opacity-50"
            >
              {t("continueToGoals")}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{t("therapyGoals")}</h2>
            <p className="text-sm text-sage-900 mt-1">{t("therapyGoalsDesc")}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {["Pain Relief", "Better Sleep", "Increased Focus", "Mood Improvement", "Appetite Stimulation", "General Wellbeing"].map((goal) => (
              <button
                key={goal}
                onClick={() => toggleArrayItem(setTherapyGoals, goal)}
                className={`rounded-xl border px-4 py-4 text-left font-bold transition-all ${
                  therapyGoals.includes(goal)
                    ? "border-pine-600 bg-pine-50 text-pine-800 shadow-sm"
                    : "border-hairline bg-white text-ink-strong hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between">
                  {goal}
                  {therapyGoals.includes(goal) && (
                    <span className="msym text-pine-600">check_circle</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="w-1/3 rounded-xl border border-hairline bg-white py-4 font-bold text-ink-strong transition-all hover:bg-surface"
            >
              {t("back")}
            </button>
            <button
              onClick={nextStep}
              disabled={!isStep3Valid}
              className="w-2/3 rounded-xl bg-pine-600 py-4 font-bold text-white transition-all hover:bg-pine-700 disabled:opacity-50"
            >
              {t("continueToCannatheraScore")}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{t("cannatheraScore")}</h2>
            <p className="text-sm text-sage-900 mt-1">{t("cannatheraScoreDesc1")}</p>
          </div>
          
          <div className="space-y-2">
            <SliderField label="Pain Intensity" value={painIntensity} onChange={setPainIntensity} minLabel="No Pain" maxLabel="Severe Pain" />
            <SliderField label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} minLabel="Very Poor" maxLabel="Excellent" />
            <SliderField label="Stress Level" value={stressLevel} onChange={setStressLevel} minLabel="Relaxed" maxLabel="Highly Stressed" />
            <SliderField label="General Symptom Burden" value={symptomBurden} onChange={setSymptomBurden} minLabel="None" maxLabel="Severe" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="w-1/3 rounded-xl border border-hairline bg-white py-4 font-bold text-ink-strong transition-all hover:bg-surface"
            >
              {t("back")}
            </button>
            <button
              onClick={nextStep}
              className="w-2/3 rounded-xl bg-pine-600 py-4 font-bold text-white transition-all hover:bg-pine-700"
            >
              {t("continue")}
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-ink-strong">{t("cannatheraScore")}</h2>
            <p className="text-sm text-sage-900 mt-1">{t("cannatheraScoreDesc2")}</p>
          </div>
          
          <div className="space-y-2">
            <SliderField label="Daily Structure" value={dailyStructure} onChange={setDailyStructure} minLabel="Chaotic" maxLabel="Structured" />
            <SliderField label="Personal Motivation" value={personalMotivation} onChange={setPersonalMotivation} minLabel="Very Low" maxLabel="Very High" />
            <SliderField label="Adherence to Treatment" value={adherence} onChange={setAdherence} minLabel="Poor" maxLabel="Excellent" />
            <SliderField label="Self-Organization" value={selfOrganization} onChange={setSelfOrganization} minLabel="Disorganized" maxLabel="Organized" />
            <SliderField label="General Quality of Life" value={qualityOfLife} onChange={setQualityOfLife} minLabel="Very Poor" maxLabel="Excellent" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={prevStep}
              disabled={loading}
              className="w-1/3 rounded-xl border border-hairline bg-white py-4 font-bold text-ink-strong transition-all hover:bg-surface disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex w-2/3 items-center justify-center gap-2 rounded-xl bg-pine-600 py-4 font-bold text-white transition-all hover:bg-pine-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Complete Onboarding"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
