export type OperatingHour = {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
};

/**
 * Safely format operating hours from database (which can be string, Array of OperatingHour, or null)
 * into a single human-readable string suitable for display.
 * CRITICAL: Never renders raw objects directly in JSX to prevent React child crashes.
 */
export function formatOperatingHours(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const germanDays = [
      "Sonntag",
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
    ];
    const todayName = germanDays[new Date().getDay()];

    const items = raw as OperatingHour[];
    const today = items.find(
      (h) => h && typeof h === "object" && h.day?.toLowerCase() === todayName.toLowerCase()
    );
    if (today) {
      if (today.closed) return "Heute: Geschlossen";
      if (today.open && today.close) return `Heute: ${today.open}–${today.close} Uhr`;
    }

    const firstOpen = items.find(
      (h) => h && typeof h === "object" && !h.closed && h.open && h.close
    );
    if (firstOpen) {
      return `Mo–Fr: ${firstOpen.open}–${firstOpen.close} Uhr`;
    }
    return null;
  }
  return null;
}

export function parseOperatingHoursList(raw: unknown): OperatingHour[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (h): h is OperatingHour =>
        Boolean(h) && typeof h === "object" && typeof (h as OperatingHour).day === "string"
    );
  }
  return [];
}
