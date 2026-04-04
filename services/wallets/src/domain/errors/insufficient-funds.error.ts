export class InsufficientFundsError extends Error {
  constructor(balanceCents: bigint, requiredCents: bigint) {
    super(
      `Insufficient funds: balance is ${balanceCents} cents, required ${requiredCents} cents`,
    );
    this.name = "InsufficientFundsError";
  }
}
