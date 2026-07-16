export const SIGNUP_ROLES = ["patient", "doctor", "pharmacy", "enterprise"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];
