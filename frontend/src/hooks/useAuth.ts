"use client";

import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const ensureFreshToken = useAuthStore((s) => s.ensureFreshToken);

  return { user, accessToken, isAuthenticated, logout, ensureFreshToken };
}
