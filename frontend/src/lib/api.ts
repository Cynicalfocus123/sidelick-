// Calls to the NestJS API. credentials: "include" sends / receives the sl_session cookie.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// code / email: extra details some answers carry (log in: code "unverified" + the account email).
export type ApiError = { status: number; message: string; fields?: Record<string, string>; code?: string; email?: string };

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? "GET",
      credentials: "include",
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw { status: 0, message: "Can't reach the server. Check your connection and try again." } satisfies ApiError;
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw {
      status: res.status,
      message: (typeof data?.message === "string" && data.message) || "Something went wrong. Please try again.",
      fields: data?.fields,
      code: data?.code,
      email: data?.email,
    } satisfies ApiError;
  }
  return data as T;
}

export type Me = { id: string; email: string; emailVerified: boolean };
