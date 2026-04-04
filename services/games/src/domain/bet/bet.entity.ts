import { BetStatus } from "./bet-status.enum";

export class Bet {
  private _status: BetStatus;
  private _cashedOutAtX100?: number;
  private _payoutCents?: bigint;
  private _cashedOutAt?: Date;

  constructor(
    readonly id: string,
    readonly roundId: string,
    readonly playerId: string,
    readonly username: string,
    readonly amountCents: bigint,
    readonly placedAt: Date,
  ) {
    this._status = BetStatus.PENDING;
  }

  get status(): BetStatus {
    return this._status;
  }

  get cashedOutAtX100(): number | undefined {
    return this._cashedOutAtX100;
  }

  get payoutCents(): bigint | undefined {
    return this._payoutCents;
  }

  get cashedOutAt(): Date | undefined {
    return this._cashedOutAt;
  }

  markWon(multiplierX100: number): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error(
        `Cannot mark bet as won: current status is ${this._status}`,
      );
    }
    this._status = BetStatus.WON;
    this._cashedOutAtX100 = multiplierX100;
    this._payoutCents = (this.amountCents * BigInt(multiplierX100)) / 100n;
    this._cashedOutAt = new Date();
  }

  markLost(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new Error(
        `Cannot mark bet as lost: current status is ${this._status}`,
      );
    }
    this._status = BetStatus.LOST;
  }
}
