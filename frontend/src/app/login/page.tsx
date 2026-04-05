"use client";

import { useEffect, useState } from "react";
import {
  generateChallenge,
  generateState,
  generateVerifier,
} from "@/lib/auth/pkce";
import { buildAuthUrl } from "@/lib/auth/keycloak";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("crash:access_token");
    if (token) window.location.href = "/game";
  }, []);

  async function handleLogin() {
    setLoading(true);
    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    const state = generateState();

    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("pkce_state", state);

    window.location.href = buildAuthUrl(challenge, state);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 p-10 rounded-xl bg-surface border border-border w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CrashGame
          </h1>
          <p className="text-sm text-foreground-muted text-center">
            Faça login para jogar e acompanhar suas apostas em tempo real.
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecionando..." : "Entrar"}
        </button>

        <p className="text-xs text-muted text-center">
          Autenticação segura via OIDC + PKCE
        </p>
      </div>
    </div>
  );
}
