import { describe, it, expect, beforeAll } from "bun:test";
import { getToken, walletsApi } from "./helpers";


let token: string;

beforeAll(async () => {
  token = await getToken("player", "player123");
});


describe("GET /health", () => {
  it("returns 200 with service identifier", async () => {
    const res = await walletsApi("/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toMatchObject({ status: "ok", service: "wallets" });
  });
});


describe("Auth guards", () => {
  it("GET /me requires auth", async () => {
    const res = await walletsApi("/me");
    expect(res.status).toBe(401);
  });

  it("POST / requires auth", async () => {
    const res = await walletsApi("/", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("POST /me/deposit requires auth", async () => {
    const res = await walletsApi("/me/deposit", {
      method: "POST",
      body: JSON.stringify({ amountCents: 500 }),
    });
    expect(res.status).toBe(401);
  });
});


describe("GET /me", () => {
  it("returns wallet with correct shape", async () => {
    const res = await walletsApi("/me", {}, token);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("playerId");
    expect(body).toHaveProperty("username");
    expect(body).toHaveProperty("balanceCents");
    expect(body).toHaveProperty("createdAt");
    expect(typeof body.balanceCents).toBe("string");
    expect(Number(body.balanceCents)).toBeGreaterThanOrEqual(0);
  });
});


describe("POST /", () => {
  it("returns 409 when wallet already exists for player", async () => {
    const res = await walletsApi("/", { method: "POST" }, token);
    expect(res.status).toBe(409);
  });
});


describe("POST /me/deposit", () => {
  it("increases balance by deposited amount", async () => {
    const beforeRes = await walletsApi("/me", {}, token);
    const before = await beforeRes.json() as any;
    const balanceBefore = Number(before.balanceCents);

    const depositAmount = 1000

    const depositRes = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({ amountCents: depositAmount }) },
      token,
    );
    expect(depositRes.status).toBe(200);

    const after = await depositRes.json() as any;
    expect(Number(after.balanceCents)).toBe(balanceBefore + depositAmount);
  });

  it("returns updated wallet shape after deposit", async () => {
    const res = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({ amountCents: 500 }) },
      token,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("balanceCents");
    expect(body).toHaveProperty("playerId");
  });

  it("rejects amountCents below minimum (50 < min 100)", async () => {
    const res = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({ amountCents: 50 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("rejects amountCents of zero", async () => {
    const res = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({ amountCents: 0 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("rejects non-integer amountCents", async () => {
    const res = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({ amountCents: 10.5 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing amountCents field", async () => {
    const res = await walletsApi(
      "/me/deposit",
      { method: "POST", body: JSON.stringify({}) },
      token,
    );
    expect(res.status).toBe(400);
  });
});
