"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

export function IntakeReminders({
  initialTimes,
}: Readonly<{
  initialTimes: string[];
}>) {
  const t = useTranslations("patient.profile");
  const router = useRouter();
  
  // Default to 3 times if empty
  const [times, setTimes] = useState<string[]>(
    initialTimes.length >= 3 ? initialTimes : ["08:00", "14:00", "20:00"]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTimeChange(index: number, val: string) {
    const newTimes = [...times];
    newTimes[index] = val;
    setTimes(newTimes);
    setSaved(false);
  }

  function handleAddTime() {
    if (times.length < 10) {
      setTimes([...times, "12:00"]);
      setSaved(false);
    }
  }

  function handleRemoveTime(index: number) {
    if (times.length > 3) {
      const newTimes = [...times];
      newTimes.splice(index, 1);
      setTimes(newTimes);
      setSaved(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api("/patient/profile/reminders", {
        method: "PATCH",
        body: { times },
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
          const error = err as Error;
      setError(error.message || "Failed to save reminders");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="border-t border-hairline pt-6">
        <h2 className="text-lg font-bold text-pine-900">Push Notification Reminders</h2>
        <p className="text-sm text-muted mt-1">
          Set between 3 and 10 daily reminder times so you never forget to log your intake and symptoms. You will receive a live pop-up notification at these exact times.
        </p>
      </div>

      <div className="rounded-xl border border-hairline bg-[#f6f8fc] p-5">
        <h3 className="font-semibold text-ink-strong mb-3">Daily Reminders ({times.length}/10)</h3>
        
        <div className="space-y-3">
          {times.map((time, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-hairline">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(idx, e.target.value)}
                className="h-10 rounded-lg border border-hairline px-3 outline-none focus:border-pine-600 font-medium"
                required
              />
              {times.length > 3 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTime(idx)}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold ml-auto"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddTime}
            disabled={times.length >= 10}
            className="text-sm font-bold text-pine-600 hover:text-pine-800 disabled:opacity-50"
          >
            + Add Another Time
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-lg bg-pine-600 px-5 font-bold text-white disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save Reminders"}
          </button>
        </div>
      </div>
    </div>
  );
}
