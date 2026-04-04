const KEYS = {
  ACCESS_TOKEN: "crash:access_token",
  REFRESH_TOKEN: "crash:refresh_token",
  ID_TOKEN: "crash:id_token",
  EXPIRES_AT: "crash:expires_at",
} as const;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  idToken: string,
  expiresIn: number,
): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(KEYS.ID_TOKEN, idToken);
  localStorage.setItem(KEYS.EXPIRES_AT, String(expiresAt));
}

export function getTokens(): StoredTokens | null {
  const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);
  const idToken = localStorage.getItem(KEYS.ID_TOKEN);
  const expiresAt = localStorage.getItem(KEYS.EXPIRES_AT);

  if (!accessToken || !refreshToken || !idToken || !expiresAt) return null;

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: Number(expiresAt),
  };
}

export function clearTokens(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export function isTokenExpiringSoon(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60_000;
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}
