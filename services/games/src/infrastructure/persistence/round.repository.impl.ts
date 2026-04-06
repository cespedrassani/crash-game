import { Injectable } from "@nestjs/common";
import { Round, RoundData } from "../../domain/round/round.entity";
import type { RoundRepository } from "../../domain/round/round.repository";
import { RoundPhase } from "../../domain/round/round-phase.enum";
import { Bet } from "../../domain/bet/bet.entity";
import { BetStatus } from "../../domain/bet/bet-status.enum";
import { CrashPoint } from "../../domain/value-objects/crash-point.vo";
import { PrismaService } from "./prisma.service";

@Injectable()
export class RoundRepositoryImpl implements RoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Round | null> {
    const data = await this.prisma.round.findUnique({
      where: { id },
      include: { bets: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async findCurrent(): Promise<Round | null> {
    const data = await this.prisma.round.findFirst({
      where: { phase: { in: [RoundPhase.BETTING, RoundPhase.RUNNING] } },
      include: { bets: true },
      orderBy: { createdAt: "desc" },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByPhase(phase: RoundPhase): Promise<Round[]> {
    const rows = await this.prisma.round.findMany({
      where: { phase: phase as RoundPhase },
      include: { bets: true },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findHistory(
    page: number,
    limit: number,
  ): Promise<{ rounds: Round[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.round.findMany({
        where: { phase: RoundPhase.FINISHED },
        include: { bets: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.round.count({ where: { phase: RoundPhase.FINISHED } }),
    ]);
    return { rounds: rows.map((r) => this.toDomain(r)), total };
  }

  async save(round: Round): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.round.upsert({
        where: { id: round.id },
        create: {
          id: round.id,
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          crashPointX100: round.crashPoint.valueX100,
          phase: round.phase,
          createdAt: round.createdAt,
          startedAt: round.startedAt ?? null,
          crashedAt: round.crashedAt ?? null,
          finishedAt: round.finishedAt ?? null,
        },
        update: {
          phase: round.phase,
          startedAt: round.startedAt ?? null,
          crashedAt: round.crashedAt ?? null,
          finishedAt: round.finishedAt ?? null,
        },
      }),
      ...round.bets.map((bet) =>
        this.prisma.bet.upsert({
          where: { id: bet.id },
          create: {
            id: bet.id,
            roundId: bet.roundId,
            playerId: bet.playerId,
            username: bet.username,
            amountCents: bet.amountCents,
            status: bet.status,
            cashedOutAtX100: bet.cashedOutAtX100 ?? null,
            payoutCents: bet.payoutCents ?? null,
            placedAt: bet.placedAt,
            cashedOutAt: bet.cashedOutAt ?? null,
          },
          update: {
            status: bet.status,
            cashedOutAtX100: bet.cashedOutAtX100 ?? null,
            payoutCents: bet.payoutCents ?? null,
            cashedOutAt: bet.cashedOutAt ?? null,
          },
        }),
      ),
    ]);
  }

  private toDomain(data: {
    id: string;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    crashPointX100: number;
    phase: string;
    createdAt: Date;
    startedAt: Date | null;
    crashedAt: Date | null;
    finishedAt: Date | null;
    bets: Array<{
      id: string;
      roundId: string;
      playerId: string;
      username: string;
      amountCents: bigint;
      status: string;
      cashedOutAtX100: number | null;
      payoutCents: bigint | null;
      placedAt: Date;
      cashedOutAt: Date | null;
    }>;
  }): Round {
    const bets = data.bets.map((b) => {
      const bet = new Bet(b.id, b.roundId, b.playerId, b.username, b.amountCents, b.placedAt);
      if (b.status === BetStatus.WON && b.cashedOutAtX100 !== null) {
        bet.markWon(b.cashedOutAtX100);
      } else if (b.status === BetStatus.LOST) {
        bet.markLost();
      }
      return bet;
    });

    const roundData: RoundData = {
      id: data.id,
      serverSeed: data.serverSeed,
      serverSeedHash: data.serverSeedHash,
      clientSeed: data.clientSeed,
      crashPoint: CrashPoint.of(data.crashPointX100),
      phase: data.phase as RoundPhase,
      bets,
      createdAt: data.createdAt,
      startedAt: data.startedAt ?? undefined,
      crashedAt: data.crashedAt ?? undefined,
      finishedAt: data.finishedAt ?? undefined,
    };

    return Round.reconstitute(roundData);
  }
}
