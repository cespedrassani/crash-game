import { create } from "zustand";
import type { AuthUser } from "@/types/player";
import { clearTokens, getTokens, setTokens } from "@/lib/auth/token";
import { extractUser } from "@/lib/auth/decode";
import { buildLogoutUrl, refreshTokens } from "@/lib/auth/keycloak";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  setSession: (
    accessToken: string,
    refreshToken: string,
    idToken: string,
    expiresIn: number,
  ) => void;
  logout: () => void;
  hydrate: () => void;
  ensureFreshToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  idToken: null,
  expiresAt: null,
  isAuthenticated: false,

  setSession(accessToken, refreshToken, idToken, expiresIn) {
    setTokens(accessToken, refreshToken, idToken, expiresIn);
    const user = extractUser(accessToken);
    const expiresAt = Date.now() + expiresIn * 1000;
    set({ user, accessToken, idToken, expiresAt, isAuthenticated: true });
  },

  logout() {
    const { idToken } = get();
    clearTokens();
    set({
      user: null,
      accessToken: null,
      idToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
    if (idToken) {
      window.location.href = buildLogoutUrl(idToken);
    } else {
      window.location.href = "/login";
    }
  },

  hydrate() {
    const stored = getTokens();
    if (!stored) return;
    const user = extractUser(stored.accessToken);
    set({
      user,
      accessToken: stored.accessToken,
      idToken: stored.idToken,
      expiresAt: stored.expiresAt,
      isAuthenticated: true,
    });
  },

  async ensureFreshToken(): Promise<string | null> {
    const { accessToken, expiresAt } = get();
    if (!accessToken) return null;

    const needsRefresh = expiresAt ? Date.now() >= expiresAt - 60_000 : true;
    if (!needsRefresh) return accessToken;

    const stored = getTokens();
    if (!stored?.refreshToken) {
      get().logout();
      return null;
    }

    try {
      const tokens = await refreshTokens(stored.refreshToken);
      get().setSession(
        tokens.access_token,
        tokens.refresh_token,
        tokens.id_token,
        tokens.expires_in,
      );
      return tokens.access_token;
    } catch {
      get().logout();
      return null;
    }
  },
}));
