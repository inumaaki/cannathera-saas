"use strict";
// Modular permission system for practice team members.
// A membership carries an explicit permission list; the UI and the API both
// gate on it, so adding a new capability = adding a key here (no rework).
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORG_ROLES = exports.ROLE_PRESETS = exports.PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.hasAny = hasAny;
exports.PERMISSIONS = [
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
];
/** Preset bundles. Admin gets everything; presets are just starting points —
    the admin can tick individual permissions per member afterwards. */
exports.ROLE_PRESETS = {
    ADMIN: [...exports.PERMISSIONS],
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
};
exports.ORG_ROLES = Object.keys(exports.ROLE_PRESETS);
function hasPermission(granted, needed) {
    return !!granted?.includes(needed);
}
function hasAny(granted, needed) {
    return needed.some((p) => hasPermission(granted, p));
}
