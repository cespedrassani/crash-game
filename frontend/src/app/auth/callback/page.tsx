"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { exchangeCode } from "@/lib/auth/keycloak";
import { useAuthStore } from "@/store/authStore";

export default function CallbackPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        console.error("Keycloak error:", params.get("error_description"));
        router.replace("/login");
        return;
      }

      if (!code || !state) {
        router.replace("/login");
        return;
      }

      const savedState = sessionStorage.getItem("pkce_state");
      const verifier = sessionStorage.getItem("pkce_verifier");

      if (state !== savedState || !verifier) {
        console.error("PKCE state mismatch");
        router.replace("/login");
        return;
      }

      sessionStorage.removeItem("pkce_state");
      sessionStorage.removeItem("pkce_verifier");

      try {
        const tokens = await exchangeCode(code, verifier);
        setSession(
          tokens.access_token,
          tokens.refresh_token,
          tokens.id_token,
          tokens.expires_in,
        );
        router.replace("/game");
      } catch (err) {
        console.error("Token exchange error:", err);
        router.replace("/login");
      }
    }

    handleCallback();
  }, [router, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-foreground-muted">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Autenticando...</p>
      </div>
    </div>
  );
}
