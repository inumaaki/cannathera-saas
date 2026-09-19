"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

let sharedAudioCtx: AudioContext | null = null;
function getAudioContext() {
  if (!sharedAudioCtx && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx?.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/** Plays a distinct, audible notification chime via Web Audio API */
export function playAudibleNotificationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // First note: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second note: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.6, now + 0.20);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch {
    // Silently ignore if AudioContext is blocked
  }
}

export function LiveReminders({ reminderTimes }: { reminderTimes: string[] }) {
  const t = useTranslations("patient.header");
  const [show, setShow] = useState(false);
  const lastTriggeredRef = useRef<string>("");

  function fireBrowserNotification(title: string, body: string) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png", tag: "intake_reminder" });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(title, { body, icon: "/icon-192.png", tag: "intake_reminder" });
        }
      });
    }
    setShow(true);
  }

  useEffect(() => {
    // Unlock AudioContext on user interaction
    const unlockAudio = () => {
      getAudioContext();
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });

    // Request browser notification permission eagerly
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!reminderTimes || reminderTimes.length === 0) return;

    // Clock-based polling (5 s)
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
        localStorage.setItem("lastReminderTrigger", currentTimeStr);
        playAudibleNotificationChime();
        fireBrowserNotification(t("logDueTitle"), t("logDueText"));
        setShow(true);
      }
    }, 5_000);

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
