import { InvalidAmountError } from "../errors/invalid-amount.error";

export class Multiplier {
  private constructor(readonly valueX100: number) {}

  static of(valueX100: number): Multiplier {
    if (!Number.isInteger(valueX100)) {
      throw new InvalidAmountError(
        `Multiplier must be a whole integer (×100). Got: ${valueX100}`,
      );
    }
    if (valueX100 < 100) {
      throw new InvalidAmountError(
        `Multiplier cannot be below 1.00x (100). Got: ${valueX100}`,
      );
    }
    return new Multiplier(valueX100);
  }

  toDisplay(): string {
    return `${(this.valueX100 / 100).toFixed(2)}x`;
  }

  isGreaterThan(other: Multiplier): boolean {
    return this.valueX100 > other.valueX100;
  }

  equals(other: Multiplier): boolean {
    return this.valueX100 === other.valueX100;
  }
}
