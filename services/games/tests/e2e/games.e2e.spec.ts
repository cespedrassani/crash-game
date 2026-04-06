import { describe, it, expect, beforeAll } from "bun:test";
import { getToken, gamesApi, waitForPhase } from "./helpers";

let token: string;

beforeAll(async () => {
  token = await getToken("player", "player123");
});

describe("GET /health", () => {
  it("returns 200 with service identifier", async () => {
    const res = await gamesApi("/health");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toMatchObject({ status: "ok", service: "games" });
  });
});

describe("GET /rounds/current", () => {
  it("returns current round shape", async () => {
    const res = await gamesApi("/rounds/current");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("phase");
    expect(["betting", "running", "crashed"]).toContain(body.phase);
    expect(body).toHaveProperty("seedHash");
    expect(Array.isArray(body.bets)).toBe(true);
  });
});

describe("GET /rounds/history", () => {
  it("returns paginated history shape", async () => {
    const res = await gamesApi("/rounds/history");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(typeof body.total).toBe("number");
  });

  it("respects page and limit query params", async () => {
    const res = await gamesApi("/rounds/history?page=1&limit=5");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.length).toBeLessThanOrEqual(5);
    expect(body.page).toBe(1);
  });
});

describe("Auth guards", () => {
  it("POST /bet requires auth", async () => {
    const res = await gamesApi("/bet", {
      method: "POST",
      body: JSON.stringify({ amount: 10 }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /bet/cashout requires auth", async () => {
    const res = await gamesApi("/bet/cashout", { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("GET /bets/me requires auth", async () => {
    const res = await gamesApi("/bets/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /bets/me", () => {
  it("returns paginated bet history for authenticated player", async () => {
    const res = await gamesApi("/bets/me", {}, token);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
  });
});

describe("POST /bet — DTO validation", () => {
  it("rejects amount below minimum (0.5 < min 1)", async () => {
    const res = await gamesApi(
      "/bet",
      { method: "POST", body: JSON.stringify({ amount: 0.5 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("rejects amount above maximum (1001 > max 1000)", async () => {
    const res = await gamesApi(
      "/bet",
      { method: "POST", body: JSON.stringify({ amount: 1001 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing amount field", async () => {
    const res = await gamesApi("/bet", { method: "POST", body: JSON.stringify({}) }, token);
    expect(res.status).toBe(400);
  });
});

describe("POST /bet/cashout — phase guard", () => {
  it("returns 400 when round is not in running phase", async () => {
    await waitForPhase("betting", 25_000);
    const res = await gamesApi("/bet/cashout", { method: "POST" }, token);
    expect(res.status).toBe(400);
  });
});

describe("Betting flow", () => {
  let roundId: string;

  beforeAll(async () => {
    const round = await waitForPhase("betting", 25_000);
    roundId = round.id;
  });

  it("places a bet and returns bet shape", async () => {
    const res = await gamesApi(
      "/bet",
      { method: "POST", body: JSON.stringify({ amount: 10 }) },
      token,
    );

    if (res.status === 400) {
      const body = await res.json() as any;
      expect(typeof body.message).toBe("string");
      return;
    }

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("amount");
    expect(body.status).toBe("pending");
    expect(body.roundId).toBe(roundId);
  });

  it("rejects a second bet in the same round", async () => {
    const current = await gamesApi("/rounds/current");
    const round = await current.json() as any;

    if (round?.id !== roundId || round?.phase !== "betting") {
      return;
    }

    const res = await gamesApi(
      "/bet",
      { method: "POST", body: JSON.stringify({ amount: 10 }) },
      token,
    );
    expect(res.status).toBe(400);
  });

  it("cashout succeeds during running phase", async () => {
    await waitForPhase("running", 20_000);
    const res = await gamesApi("/bet/cashout", { method: "POST" }, token);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe("won");
    expect(typeof body.cashoutMultiplier).toBe("number");
    expect(body.cashoutMultiplier).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /rounds/:id/verify", () => {
  it("verifies a completed round from history", async () => {
    const historyRes = await gamesApi("/rounds/history?page=1&limit=1");
    const history = await historyRes.json() as any;

    if (history.data.length === 0) {
      return;
    }

    const completedRound = history.data[0] as any;
    const res = await gamesApi(`/rounds/${completedRound.id}/verify`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.verified).toBe(true);
    expect(body).toHaveProperty("serverSeed");
    expect(body).toHaveProperty("crashPoint");
  });
});
