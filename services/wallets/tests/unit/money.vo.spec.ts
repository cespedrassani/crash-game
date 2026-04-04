import { describe, it, expect } from "bun:test";
import { Money } from "../../src/domain/value-objects/money.vo";
import { InsufficientFundsError } from "../../src/domain/errors/insufficient-funds.error";
import { InvalidAmountError } from "../../src/domain/errors/invalid-amount.error";

describe("Money", () => {
  it("creates from valid bigint", () => {
    const m = Money.of(1000n);
    expect(m.cents).toBe(1000n);
  });

  it("throws on negative value", () => {
    expect(() => Money.of(-1n)).toThrow(InvalidAmountError);
  });

  it("allows zero", () => {
    const m = Money.of(0n);
    expect(m.isZero()).toBe(true);
  });

  it("adds correctly", () => {
    const a = Money.of(500n);
    const b = Money.of(300n);
    expect(a.add(b).cents).toBe(800n);
  });

  it("subtracts correctly", () => {
    const a = Money.of(500n);
    const b = Money.of(300n);
    expect(a.subtract(b).cents).toBe(200n);
  });

  it("throws InsufficientFundsError on overdraft", () => {
    const a = Money.of(100n);
    const b = Money.of(200n);
    expect(() => a.subtract(b)).toThrow(InsufficientFundsError);
  });

  it("compares correctly", () => {
    expect(Money.of(100n).isLessThan(Money.of(200n))).toBe(true);
    expect(Money.of(200n).isGreaterThan(Money.of(100n))).toBe(true);
    expect(Money.of(100n).equals(Money.of(100n))).toBe(true);
  });
});
