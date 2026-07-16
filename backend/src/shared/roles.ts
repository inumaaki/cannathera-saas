// Role constants shared between web and api. Mirror of Prisma `Role` enum.
export const ROLES = ["PATIENT", "DOCTOR", "PHARMACY", "ENTERPRISE", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];

// Landing route per role after login (dashboard shells filled in later modules).
export const ROLE_HOME: Record<AppRole, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  PHARMACY: "/pharmacy",
  ENTERPRISE: "/enterprise",
  ADMIN: "/admin",
};
