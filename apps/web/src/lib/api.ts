// Minimal API client for the NestJS backend. Cookies carry auth (httpOnly).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

export async function api<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (typeof data.message === "string") code = data.message;
      else if (Array.isArray(data.message)) code = "VALIDATION_ERROR";
    } catch {
      // keep generic code
    }
    throw new ApiError(res.status, code);
  }

  return (await res.json()) as T;
}
