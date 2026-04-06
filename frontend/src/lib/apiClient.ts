import { useAuthStore } from "@/store/authStore";
import { getTokens } from "@/lib/auth/token";
import { refreshTokens } from "@/lib/auth/keycloak";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = await useAuthStore.getState().ensureFreshToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: { message?: string; code?: number } = {};
    try {
      body = (await res.json()) as { message?: string; code?: number };
    } catch {}

    const isAuthError = res.status === 401;

    if (isAuthError && !isRetry) {
      const stored = getTokens();
      if (stored?.refreshToken) {
        try {
          const tokens = await refreshTokens(stored.refreshToken);
          useAuthStore
            .getState()
            .setSession(
              tokens.access_token,
              tokens.refresh_token,
              tokens.id_token,
              tokens.expires_in,
            );
          return apiFetch<T>(path, options, true);
        } catch {
          useAuthStore.getState().logout();
          throw Object.assign(
            new Error("Sessão expirada. Faça login novamente."),
            { status: 401 },
          );
        }
      }
      useAuthStore.getState().logout();
      throw Object.assign(new Error("Sessão expirada. Faça login novamente."), {
        status: 401,
      });
    }

    const message = body.message ?? `HTTP ${res.status}`;
    throw Object.assign(new Error(message), { status: res.status });
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};
