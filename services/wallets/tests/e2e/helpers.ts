const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://localhost:8080";
const WALLETS_URL = process.env.WALLETS_URL ?? "http://localhost:4002";
const REALM = "crash-game";
const CLIENT_ID = "crash-game-client";

export async function getToken(username: string, password: string): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: CLIENT_ID,
        username,
        password,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Keycloak auth failed for "${username}": ${res.status} ${body}`);
  }

  const data = await res.json() as any;
  return data.access_token as string;
}

export async function walletsApi(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${WALLETS_URL}${path}`, { ...options, headers });
}
