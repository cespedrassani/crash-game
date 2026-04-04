import type { AuthUser } from "@/types/player";

interface JwtPayload {
  sub: string;
  preferred_username?: string;
  email?: string;
  exp: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractUser(accessToken: string): AuthUser | null {
  const payload = decodeJwt(accessToken);
  if (!payload) return null;
  return {
    sub: payload.sub,
    username: payload.preferred_username ?? payload.sub,
    email: payload.email,
  };
}
