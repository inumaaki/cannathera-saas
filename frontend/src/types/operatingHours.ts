/**
 * Represents a single day's opening hours for a pharmacy or practice.
 * Used across pharmacy settings, doctor settings, patient inventory,
 * and pharmacy search results.
 */
export type OperatingHour = {
  /** Full day name in German, e.g. "Montag" */
  day: string;
  /** Opening time in HH:MM format, e.g. "09:00" */
  open: string;
  /** Closing time in HH:MM format, e.g. "18:00" */
  close: string;
  /** Whether the location is closed this day */
  closed: boolean;
};
