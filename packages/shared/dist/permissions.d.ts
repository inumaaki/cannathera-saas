export declare const PERMISSIONS: readonly ["patients:view", "patients:create", "patients:note", "alerts:view", "alerts:acknowledge", "appointments:manage", "reports:view", "settings:practice", "settings:team", "compliance:view"];
export type Permission = (typeof PERMISSIONS)[number];
/** Preset bundles. Admin gets everything; presets are just starting points —
    the admin can tick individual permissions per member afterwards. */
export declare const ROLE_PRESETS: {
    readonly ADMIN: readonly ["patients:view", "patients:create", "patients:note", "alerts:view", "alerts:acknowledge", "appointments:manage", "reports:view", "settings:practice", "settings:team", "compliance:view"];
    readonly DOCTOR: readonly ["patients:view", "patients:create", "patients:note", "alerts:view", "alerts:acknowledge", "appointments:manage", "reports:view"];
    readonly ASSISTANT: readonly ["patients:view", "alerts:view", "appointments:manage"];
    readonly VIEWER: readonly ["patients:view", "reports:view"];
};
export type OrgRole = keyof typeof ROLE_PRESETS;
export declare const ORG_ROLES: OrgRole[];
export declare function hasPermission(granted: readonly string[] | undefined | null, needed: Permission): boolean;
export declare function hasAny(granted: readonly string[] | undefined | null, needed: readonly Permission[]): boolean;
