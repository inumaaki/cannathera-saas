"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";

export type LiveEvent = {
  kind: "red_flag" | "log_submitted" | "review_due" | "stock_low" | "appointment" | "report_ready" | "prescription_received" | "prescription_status_update" | "intake_reminder";
  severity: "info" | "warning" | "critical";
  title: string;
  text: string;
  href: string;
  at: string;
};

const ICONS: Record<LiveEvent["kind"], string> = {
  red_flag: "warning",
  log_submitted: "edit_note",
  review_due: "assignment_late",
  stock_low: "inventory_2",
  appointment: "videocam",
  report_ready: "picture_as_pdf",
  prescription_received: "receipt_long",
  prescription_status_update: "update",
  intake_reminder: "alarm",
};

/**
 * Subscribes to the server's notification stream (SSE).
 *
 * The events arriving here are only the ones the server addressed to this user
 * or their organisation — the filtering is server-side, never trusted to the
 * client. Reconnection is handled by EventSource itself.
 */
export function useLiveNotifications() {
  const router = useRouter();
  const [live, setLive] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Request browser notification permission eagerly so reminders can fire.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const source = new EventSource(`${API_URL}/notifications/stream`, {
      withCredentials: true,
    });

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false); // EventSource retries on its own

    source.onmessage = (e) => {
      const payload = JSON.parse(e.data) as LiveEvent | { type: "ping" };
      if ("type" in payload) return; // heartbeat
      if (!payload.title && !payload.text) return;

      setLive((prev) => [payload, ...prev].slice(0, 20));
      // Pull the server-rendered counts back in sync with what just arrived.
      router.refresh();

      // Fire a real browser push notification for reminder and critical events.
      const shouldPush =
        payload.kind === "intake_reminder" ||
        payload.severity === "critical" ||
        payload.kind === "prescription_status_update";

      if (shouldPush && typeof Notification !== "undefined") {
        if (Notification.permission === "granted") {
          new Notification(payload.title, {
            body: payload.text,
            icon: "/icon-192.png",
            tag: payload.kind, // prevents duplicate stacking for same kind
          });
        } else if (Notification.permission === "default") {
          // Ask again then fire
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification(payload.title, {
                body: payload.text,
                icon: "/icon-192.png",
                tag: payload.kind,
              });
            }
          });
        }
      }
    };

    return () => source.close();
  }, [router]);

  return {
    connected,
    live,
    icon: (kind: LiveEvent["kind"]) => ICONS[kind] ?? "notifications",
    dismiss: (at: string) => setLive((prev) => prev.filter((e) => e.at !== at)),
  };
}
