import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { randomUUID } from "node:crypto";
import { Round } from "../../domain/round/round.entity";
import { RoundPhase } from "../../domain/round/round-phase.enum";
import { BetStatus } from "../../domain/bet/bet-status.enum";
import { RoundRepository } from "../../domain/round/round.repository";
import { GameGateway } from "../../infrastructure/websocket/game.gateway";
import { WalletCommandsPublisher } from "../../infrastructure/messaging/wallet-commands.publisher";

const BETTING_DURATION_MS = parseInt(process.env.BETTING_PHASE_DURATION_MS ?? "10000");
const TICK_INTERVAL_MS = 100;
const INTER_ROUND_DELAY_MS = parseInt(process.env.INTER_ROUND_DELAY_MS ?? "3000");

@Injectable()
export class GameEngineService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GameEngineService.name);
  private tickInterval?: ReturnType<typeof setInterval>;
  private currentMultiplierX100 = 100;
  private roundStartTime?: number;

  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly gateway: GameGateway,
    private readonly publisher: WalletCommandsPublisher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.recoverOrStart();
  }

  getCurrentMultiplierX100(): number {
    return this.currentMultiplierX100;
  }

  private async recoverOrStart(): Promise<void> {
    const current = await this.roundRepository.findCurrent();

    if (!current) {
      await this.startNewRound();
      return;
    }

    if (current.phase === RoundPhase.RUNNING) {
      this.logger.warn(`Recovering crashed RUNNING round ${current.id} — crashing it`);
      current.crash();
      await this.roundRepository.save(current);
      await this.publishCashoutCredits(current);
      current.finish();
      await this.roundRepository.save(current);
      setTimeout(() => this.startNewRound(), INTER_ROUND_DELAY_MS);
      return;
    }

    if (current.phase === RoundPhase.BETTING) {
      this.logger.log(`Resuming BETTING round ${current.id}`);
      this.emitBettingPhase(current);
      setTimeout(() => this.startRunningPhase(current.id), BETTING_DURATION_MS);
    }
  }

  private async startNewRound(): Promise<void> {
    const serverSeed = randomBytes(32).toString("hex");
    const clientSeed = randomUUID();
    const round = Round.create(serverSeed, clientSeed);
    await this.roundRepository.save(round);

    this.logger.log(`New round ${round.id} — crashPoint: ${round.crashPoint.toDisplay()}`);

    this.emitBettingPhase(round);
    setTimeout(() => this.startRunningPhase(round.id), BETTING_DURATION_MS);
  }

  private emitBettingPhase(round: Round): void {
    this.gateway.emitBettingPhase({
      roundId: round.id,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      endsAt: new Date(Date.now() + BETTING_DURATION_MS).toISOString(),
    });
  }

  private async startRunningPhase(roundId: string): Promise<void> {
    const round = await this.roundRepository.findById(roundId);
    if (!round || round.phase !== RoundPhase.BETTING) return;

    round.startRound();
    await this.roundRepository.save(round);

    this.currentMultiplierX100 = 100;
    this.roundStartTime = Date.now();

    this.gateway.emitRoundStarted({ roundId: round.id, startedAt: new Date().toISOString() });
    this.logger.log(`Round ${round.id} started`);

    this.tickInterval = setInterval(
      () => void this.tick(round.id, round.crashPoint.valueX100),
      TICK_INTERVAL_MS,
    );
  }

  private async tick(roundId: string, crashPointX100: number): Promise<void> {
    const elapsedMs = Date.now() - this.roundStartTime!;
    this.currentMultiplierX100 = Math.floor(100 * Math.pow(Math.E, 0.00006 * elapsedMs));

    this.gateway.emitTick({
      multiplierX100: this.currentMultiplierX100,
      elapsedMs,
    });

    if (this.currentMultiplierX100 >= crashPointX100) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
      await this.crashRound(roundId);
    }
  }

  private async crashRound(roundId: string): Promise<void> {
    const round = await this.roundRepository.findById(roundId);
    if (!round || round.phase !== RoundPhase.RUNNING) return;

    round.crash();
    await this.roundRepository.save(round);

    this.gateway.emitRoundCrashed({
      roundId: round.id,
      crashPointX100: round.crashPoint.valueX100,
      serverSeed: round.serverSeed,
    });

    this.logger.log(
      `Round ${round.id} crashed at ${round.crashPoint.toDisplay()}`,
    );

    await this.publishCashoutCredits(round);

    round.finish();
    await this.roundRepository.save(round);

    setTimeout(() => void this.startNewRound(), INTER_ROUND_DELAY_MS);
  }

  private async publishCashoutCredits(round: Round): Promise<void> {
    const wonBets = round.bets.filter((b) => b.status === BetStatus.WON);
    for (const bet of wonBets) {
      await this.publisher.publishCreditRequested({
        betId: bet.id,
        roundId: round.id,
        playerId: bet.playerId,
        amountCents: Number(bet.payoutCents!),
        multiplierX100: bet.cashedOutAtX100!,
      });
    }
  }
}
