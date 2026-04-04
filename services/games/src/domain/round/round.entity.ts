import { randomUUID } from "node:crypto";
import { Bet } from "../bet/bet.entity";
import { BetStatus } from "../bet/bet-status.enum";
import { CrashPoint } from "../value-objects/crash-point.vo";
import { DomainEvent } from "../events/domain-event";
import { BetCashedOutEvent } from "../events/bet-cashed-out.event";
import { BetPlacedEvent } from "../events/bet-placed.event";
import { RoundCrashedEvent } from "../events/round-crashed.event";
import { RoundFinishedEvent } from "../events/round-finished.event";
import { RoundStartedEvent } from "../events/round-started.event";
import { BetNotFoundError } from "../errors/bet-not-found.error";
import { InvalidAmountError } from "../errors/invalid-amount.error";
import { InvalidStateTransitionError } from "../errors/invalid-state-transition.error";
import { PlayerAlreadyBetError } from "../errors/player-already-bet.error";
import { PlayerAlreadyCashedOutError } from "../errors/player-already-cashed-out.error";
import { RoundNotInBettingPhaseError } from "../errors/round-not-in-betting-phase.error";
import { RoundNotRunningError } from "../errors/round-not-running.error";
import { ProvalyFairService } from "../provably-fair/provably-fair.service";
import { RoundPhase } from "./round-phase.enum";

const MIN_BET_CENTS = 100n;
const MAX_BET_CENTS = 100_000n;

export interface RoundData {
  id: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  crashPoint: CrashPoint;
  phase: RoundPhase;
  bets: Bet[];
  createdAt: Date;
  startedAt?: Date;
  crashedAt?: Date;
  finishedAt?: Date;
}

export class Round {
  private _phase: RoundPhase;
  private readonly _bets: Bet[];
  private _startedAt?: Date;
  private _crashedAt?: Date;
  private _finishedAt?: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(
    readonly id: string,
    readonly serverSeed: string,
    readonly serverSeedHash: string,
    readonly clientSeed: string,
    readonly crashPoint: CrashPoint,
    readonly createdAt: Date,
    phase: RoundPhase,
    bets: Bet[],
    startedAt?: Date,
    crashedAt?: Date,
    finishedAt?: Date,
  ) {
    this._phase = phase;
    this._bets = bets;
    this._startedAt = startedAt;
    this._crashedAt = crashedAt;
    this._finishedAt = finishedAt;
    this._domainEvents = [];
  }

  static create(serverSeed: string, clientSeed: string): Round {
    const id = randomUUID();
    const serverSeedHash = ProvalyFairService.hashSeed(serverSeed);
    const crashPoint = ProvalyFairService.calculateCrashPoint(serverSeed, clientSeed);
    return new Round(id, serverSeed, serverSeedHash, clientSeed, crashPoint, new Date(), RoundPhase.BETTING, []);
  }

  static reconstitute(data: RoundData): Round {
    return new Round(
      data.id,
      data.serverSeed,
      data.serverSeedHash,
      data.clientSeed,
      data.crashPoint,
      data.createdAt,
      data.phase,
      data.bets,
      data.startedAt,
      data.crashedAt,
      data.finishedAt,
    );
  }

  get phase(): RoundPhase {
    return this._phase;
  }

  get bets(): readonly Bet[] {
    return this._bets;
  }

  get startedAt(): Date | undefined {
    return this._startedAt;
  }

  get crashedAt(): Date | undefined {
    return this._crashedAt;
  }

  get finishedAt(): Date | undefined {
    return this._finishedAt;
  }

  placeBet(playerId: string, username: string, amountCents: bigint): Bet {
    if (this._phase !== RoundPhase.BETTING) {
      throw new RoundNotInBettingPhaseError(this._phase);
    }
    if (this.hasPlayerBet(playerId)) {
      throw new PlayerAlreadyBetError(playerId);
    }
    if (amountCents < MIN_BET_CENTS || amountCents > MAX_BET_CENTS) {
      throw new InvalidAmountError(
        `Bet amount must be between ${MIN_BET_CENTS} and ${MAX_BET_CENTS} cents`,
      );
    }

    const bet = new Bet(randomUUID(), this.id, playerId, username, amountCents, new Date());
    this._bets.push(bet);
    this._domainEvents.push(
      new BetPlacedEvent(this.id, bet.id, playerId, username, amountCents),
    );
    return bet;
  }

  startRound(): void {
    if (this._phase !== RoundPhase.BETTING) {
      throw new InvalidStateTransitionError(this._phase, RoundPhase.RUNNING);
    }
    this._phase = RoundPhase.RUNNING;
    this._startedAt = new Date();
    this._domainEvents.push(
      new RoundStartedEvent(this.id, this.serverSeedHash, this.clientSeed),
    );
  }

  cashOut(playerId: string, currentMultiplierX100: number): Bet {
    if (this._phase !== RoundPhase.RUNNING) {
      throw new RoundNotRunningError(this._phase);
    }
    const bet = this.getBetByPlayer(playerId);
    if (!bet) {
      throw new BetNotFoundError(playerId);
    }
    if (bet.status !== BetStatus.PENDING) {
      throw new PlayerAlreadyCashedOutError(playerId);
    }

    bet.markWon(currentMultiplierX100);
    this._domainEvents.push(
      new BetCashedOutEvent(
        this.id,
        bet.id,
        playerId,
        bet.username,
        currentMultiplierX100,
        bet.payoutCents!,
      ),
    );
    return bet;
  }

  crash(): void {
    if (this._phase !== RoundPhase.RUNNING) {
      throw new InvalidStateTransitionError(this._phase, RoundPhase.CRASHED);
    }
    this._phase = RoundPhase.CRASHED;
    this._crashedAt = new Date();

    for (const bet of this._bets) {
      if (bet.status === BetStatus.PENDING) {
        bet.markLost();
      }
    }

    this._domainEvents.push(
      new RoundCrashedEvent(this.id, this.crashPoint.valueX100, this.serverSeed),
    );
  }

  finish(): void {
    if (this._phase !== RoundPhase.CRASHED) {
      throw new InvalidStateTransitionError(this._phase, RoundPhase.FINISHED);
    }
    this._phase = RoundPhase.FINISHED;
    this._finishedAt = new Date();
    this._domainEvents.push(new RoundFinishedEvent(this.id));
  }

  getBetByPlayer(playerId: string): Bet | undefined {
    return this._bets.find((b) => b.playerId === playerId);
  }

  hasPlayerBet(playerId: string): boolean {
    return this._bets.some((b) => b.playerId === playerId);
  }

  pendingBets(): Bet[] {
    return this._bets.filter((b) => b.status === BetStatus.PENDING);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}
