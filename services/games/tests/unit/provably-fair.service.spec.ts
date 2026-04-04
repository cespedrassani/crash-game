import { describe, it, expect } from "bun:test";
import { ProvalyFairService } from "../../src/domain/provably-fair/provably-fair.service";
import { CrashPoint } from "../../src/domain/value-objects/crash-point.vo";

const SERVER_SEED = "deadbeef".repeat(8);
const CLIENT_SEED = "cafebabe-0000-0000-0000-000000000001";

describe("ProvalyFairService", () => {
  describe("hashSeed", () => {
    it("returns 64-char hex string", () => {
      const hash = ProvalyFairService.hashSeed(SERVER_SEED);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("is deterministic", () => {
      expect(ProvalyFairService.hashSeed(SERVER_SEED)).toBe(
        ProvalyFairService.hashSeed(SERVER_SEED),
      );
    });

    it("differs for different seeds", () => {
      expect(ProvalyFairService.hashSeed("seed-a")).not.toBe(
        ProvalyFairService.hashSeed("seed-b"),
      );
    });
  });

  describe("calculateCrashPoint", () => {
    it("returns CrashPoint >= 1.00x (100)", () => {
      const cp = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      expect(cp.valueX100).toBeGreaterThanOrEqual(100);
    });

    it("is deterministic — same seeds always produce same crash point", () => {
      const cp1 = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      const cp2 = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      expect(cp1.valueX100).toBe(cp2.valueX100);
    });

    it("different seeds produce different crash points (statistically)", () => {
      const results = new Set<number>();
      for (let i = 0; i < 20; i++) {
        const cp = ProvalyFairService.calculateCrashPoint(SERVER_SEED, `client-seed-${i}`);
        results.add(cp.valueX100);
      }
      expect(results.size).toBeGreaterThan(1);
    });

    it("house edge: some rounds crash at exactly 1.00x", () => {
      let instantCrashCount = 0;
      for (let i = 0; i < 1000; i++) {
        const cp = ProvalyFairService.calculateCrashPoint(`seed-${i}`, CLIENT_SEED);
        if (cp.valueX100 === 100) instantCrashCount++;
      }
      expect(instantCrashCount).toBeGreaterThan(0);
    });
  });

  describe("verify", () => {
    it("returns true for correct crash point", () => {
      const cp = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      expect(ProvalyFairService.verify(SERVER_SEED, CLIENT_SEED, cp.valueX100)).toBe(true);
    });

    it("returns false for wrong crash point", () => {
      const cp = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      expect(ProvalyFairService.verify(SERVER_SEED, CLIENT_SEED, cp.valueX100 + 1)).toBe(false);
    });

    it("returns false when server seed is wrong", () => {
      const cp = ProvalyFairService.calculateCrashPoint(SERVER_SEED, CLIENT_SEED);
      expect(ProvalyFairService.verify("wrong-seed", CLIENT_SEED, cp.valueX100)).toBe(false);
    });
  });

  describe("crash point distribution sanity", () => {
    it("most crash points are above 1.00x", () => {
      let above100 = 0;
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const cp = ProvalyFairService.calculateCrashPoint(`server-${i}`, `client-${i}`);
        if (cp.valueX100 > 100) above100++;
      }
      expect(above100 / total).toBeGreaterThan(0.9);
    });
  });
});
