import { InvalidAmountError } from "../errors/invalid-amount.error";
import { Multiplier } from "./multiplier.vo";

export class CrashPoint {
  private constructor(readonly valueX100: number) {}

  static of(valueX100: number): CrashPoint {
    if (!Number.isInteger(valueX100)) {
      throw new InvalidAmountError(
        `CrashPoint must be a whole integer (×100). Got: ${valueX100}`,
      );
    }
    if (valueX100 < 100) {
      throw new InvalidAmountError(
        `CrashPoint cannot be below 1.00x (100). Got: ${valueX100}`,
      );
    }
    return new CrashPoint(valueX100);
  }

  toMultiplier(): Multiplier {
    return Multiplier.of(this.valueX100);
  }

  toDisplay(): string {
    return `${(this.valueX100 / 100).toFixed(2)}x`;
  }

  equals(other: CrashPoint): boolean {
    return this.valueX100 === other.valueX100;
  }
}
