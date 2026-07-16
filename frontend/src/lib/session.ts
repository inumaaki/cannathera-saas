import "server-only";
import { cookies } from "next/headers";
import { API_URL } from "./api";

export type SessionUser = {
  id: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "PHARMACY" | "ENTERPRISE" | "ADMIN";
  firstName: string | null;
  lastName: string | null;
  locale: string;
  mustChangePassword: boolean;
  orgId: string | null;
  orgRole: string | null;
  permissions: string[];
};

/** Server-side: fetch the logged-in user by forwarding the session cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as SessionUser;
}
