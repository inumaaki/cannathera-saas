import "server-only";
import { cookies } from "next/headers";
import { API_URL } from "./api";

/** Server-side API fetch forwarding the session cookie. Returns null on error. */
export async function apiServer<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const res = await fetch(`${API_URL}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}
