"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/** Plays a short beep via the Web Audio API — no external file needed. */
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);         // A5
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);  // E5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.30);  // A5

    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.60);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.65);
  } catch {
    // Silently ignore if AudioContext is blocked
  }
}

export function LiveReminders({ reminderTimes }: { reminderTimes: string[] }) {
  const t = useTranslations("patient.header");
  const [show, setShow] = useState(false);
  const lastTriggeredRef = useRef<string>("");

  useEffect(() => {
    if (!reminderTimes || reminderTimes.length === 0) return;

    // Request browser notification permission eagerly
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${hh}:${mm}`;

      if (
        reminderTimes.includes(currentTimeStr) &&
        lastTriggeredRef.current !== currentTimeStr
      ) {
        lastTriggeredRef.current = currentTimeStr;
        // Also persist across page reloads
        localStorage.setItem("lastReminderTrigger", currentTimeStr);

        // Play audible alarm
        playAlarm();

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(t("logDueTitle"), {
            body: t("logDueText"),
            icon: "/icon-192.png",
          });
        } else {
          // Fallback: show in-app banner
          setShow(true);
        }
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [reminderTimes, t]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] bg-pine-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-10">
      <div className="flex items-center gap-3">
        <span aria-hidden className="msym text-3xl animate-pulse">alarm</span>
        <div>
          <p className="font-bold">{t("logDueTitle")}</p>
          <p className="text-sm opacity-90">{t("logDueText")}</p>
        </div>
      </div>
      <button
        onClick={() => setShow(false)}
        className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex items-center justify-center"
      >
        <span aria-hidden className="msym text-xl">close</span>
      </button>
    </div>
  );
}
