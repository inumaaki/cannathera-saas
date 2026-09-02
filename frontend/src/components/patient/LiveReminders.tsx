"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function LiveReminders({ reminderTimes }: { reminderTimes: string[] }) {
  const t = useTranslations("patient.header");
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (!reminderTimes || reminderTimes.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hh}:${mm}`;

      const lastTriggered = localStorage.getItem("lastReminderTrigger");
      
      if (reminderTimes.includes(currentTimeStr) && lastTriggered !== currentTimeStr) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(t("logDueTitle"), {
            body: t("logDueText")
          });
        } else {
          setShow(true);
        }
        localStorage.setItem("lastReminderTrigger", currentTimeStr);
      }
    }, 15000);

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [reminderTimes, t]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] bg-pine-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-10">
      <div className="flex items-center gap-3">
        <span aria-hidden className="msym text-3xl">timer</span>
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
