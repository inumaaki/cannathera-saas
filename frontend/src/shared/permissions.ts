// Modular permission system for practice team members.
// A membership carries an explicit permission list; the UI and the API both
// gate on it, so adding a new capability = adding a key here (no rework).

export const PERMISSIONS = [
  "patients:view", // see roster + patient files
  "patients:create", // onboard new patients
  "patients:note", // write clinical notes
  "alerts:view", // red-flag inbox
  "alerts:acknowledge", // mark red-flags reviewed
  "appointments:manage", // reschedule consultations
  "reports:view", // clinical reports + exports
  "settings:practice", // practice profile, notifications, integrations
  "settings:team", // invite/manage team members and their permissions
  "compliance:view", // compliance page + audit export
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Preset bundles. Admin gets everything; presets are just starting points —
    the admin can tick individual permissions per member afterwards. */
export const ROLE_PRESETS = {
  ADMIN: [...PERMISSIONS],
  DOCTOR: [
    "patients:view",
    "patients:create",
    "patients:note",
    "alerts:view",
    "alerts:acknowledge",
    "appointments:manage",
    "reports:view",
  ],
  ASSISTANT: ["patients:view", "alerts:view", "appointments:manage"],
  VIEWER: ["patients:view", "reports:view"],
} as const satisfies Record<string, readonly Permission[]>;

export type OrgRole = keyof typeof ROLE_PRESETS;
export const ORG_ROLES = Object.keys(ROLE_PRESETS) as OrgRole[];

export function hasPermission(
  granted: readonly string[] | undefined | null,
  needed: Permission,
): boolean {
  return !!granted?.includes(needed);
}

export function hasAny(
  granted: readonly string[] | undefined | null,
  needed: readonly Permission[],
): boolean {
  return needed.some((p) => hasPermission(granted, p));
}
