import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service";

export interface GetPlayerBetsQuery {
  playerId: string;
  page: number;
  limit: number;
}

export interface PlayerBetRecord {
  id: string;
  roundId: string;
  playerId: string;
  username: string;
  amountCents: bigint;
  status: string;
  cashedOutAtX100: number | null;
  payoutCents: bigint | null;
  placedAt: Date;
  crashPointX100: number;
}

@Injectable()
export class GetPlayerBetsHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPlayerBetsQuery): Promise<{ bets: PlayerBetRecord[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.bet.findMany({
        where: { playerId: query.playerId },
        include: { round: { select: { crashPointX100: true } } },
        orderBy: { placedAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.bet.count({ where: { playerId: query.playerId } }),
    ]);

    return {
      bets: rows.map((b) => ({
        id: b.id,
        roundId: b.roundId,
        playerId: b.playerId,
        username: b.username,
        amountCents: b.amountCents,
        status: b.status,
        cashedOutAtX100: b.cashedOutAtX100,
        payoutCents: b.payoutCents,
        placedAt: b.placedAt,
        crashPointX100: b.round.crashPointX100,
      })),
      total,
    };
  }
}
