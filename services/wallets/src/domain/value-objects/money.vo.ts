import { InsufficientFundsError } from "../errors/insufficient-funds.error";
import { InvalidAmountError } from "../errors/invalid-amount.error";

export class Money {
  private constructor(readonly cents: bigint) {}

  static of(cents: bigint): Money {
    if (typeof cents !== "bigint") {
      throw new InvalidAmountError("Money must be constructed from bigint");
    }
    if (cents < 0n) {
      throw new InvalidAmountError(`Money amount cannot be negative: ${cents}`);
    }
    return new Money(cents);
  }

  static readonly ZERO = new Money(0n);

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    if (this.cents < other.cents) {
      throw new InsufficientFundsError(this.cents, other.cents);
    }
    return new Money(this.cents - other.cents);
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isZero(): boolean {
    return this.cents === 0n;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
