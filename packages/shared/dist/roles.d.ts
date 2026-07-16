export declare const ROLES: readonly ["PATIENT", "DOCTOR", "PHARMACY", "ENTERPRISE", "ADMIN"];
export type AppRole = (typeof ROLES)[number];
export declare const ROLE_HOME: Record<AppRole, string>;
