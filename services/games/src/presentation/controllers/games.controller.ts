import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtGuard } from "../../infrastructure/auth/jwt.guard";
import { AuthenticatedUser } from "../../infrastructure/auth/jwt.strategy";
import { PlaceBetHandler } from "../../application/commands/place-bet/place-bet.handler";
import { CashoutHandler } from "../../application/commands/cashout/cashout.handler";
import { GetCurrentRoundHandler } from "../../application/queries/get-current-round.handler";
import { GetRoundHistoryHandler } from "../../application/queries/get-round-history.handler";
import {
  GetPlayerBetsHandler,
  PlayerBetRecord,
} from "../../application/queries/get-player-bets.handler";
import { VerifyRoundHandler } from "../../application/queries/verify-round.handler";
import { PlaceBetDto } from "../dtos/place-bet.dto";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { Round } from "../../domain/round/round.entity";
import { RoundPhase } from "../../domain/round/round-phase.enum";
import { Bet } from "../../domain/bet/bet.entity";
import { BetStatus } from "../../domain/bet/bet-status.enum";

@ApiTags("games")
@Controller()
export class GamesController {
  constructor(
    private readonly placeBetHandler: PlaceBetHandler,
    private readonly cashoutHandler: CashoutHandler,
    private readonly getCurrentRoundHandler: GetCurrentRoundHandler,
    private readonly getRoundHistoryHandler: GetRoundHistoryHandler,
    private readonly getPlayerBetsHandler: GetPlayerBetsHandler,
    private readonly verifyRoundHandler: VerifyRoundHandler,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("rounds/current")
  @ApiOperation({ summary: "Get current round state with all bets" })
  async getCurrentRound() {
    const result = await this.getCurrentRoundHandler.execute();
    if (!result) return null;
    return this.toRoundDto(result.round);
  }

  @Get("rounds/history")
  @ApiOperation({ summary: "Get paginated round history" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getRoundHistory(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    const { rounds, total } = await this.getRoundHistoryHandler.execute({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    });
    return {
      data: rounds.map((r) => ({
        id: r.id,
        crashPoint: r.crashPoint.valueX100 / 100,
        endedAt: (r.crashedAt ?? r.createdAt).toISOString(),
        seedHash: r.serverSeedHash,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get("rounds/:roundId/verify")
  @ApiOperation({ summary: "Verify provably fair result for a round" })
  async verifyRound(@Param("roundId") roundId: string) {
    return this.verifyRoundHandler.execute({ roundId });
  }

  @Get("bets/me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get authenticated player bet history" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getMyBets(
    @Request() req: { user: AuthenticatedUser },
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    const { bets, total } = await this.getPlayerBetsHandler.execute({
      playerId: req.user.playerId,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    });
    return {
      data: bets.map((b) => this.toPlayerBetDto(b)),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Post("bet")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Place a bet in the current betting phase" })
  async placeBet(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: PlaceBetDto,
  ) {
    const bet = await this.placeBetHandler.execute({
      playerId: req.user.playerId,
      username: req.user.username,
      amountCents: BigInt(Math.round(dto.amount * 100)),
    });
    return this.toBetDto(bet, bet.roundId);
  }

  @Post("bet/cashout")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cash out at current multiplier" })
  async cashout(@Request() req: { user: AuthenticatedUser }) {
    const bet = await this.cashoutHandler.execute({ playerId: req.user.playerId });
    return this.toBetDto(bet, bet.roundId);
  }

  private toRoundDto(round: Round) {
    const isRevealed = round.phase === RoundPhase.CRASHED || round.phase === RoundPhase.FINISHED;
    return {
      id: round.id,
      phase: this.mapPhase(round.phase),
      seedHash: round.serverSeedHash,
      crashPoint: isRevealed ? round.crashPoint.valueX100 / 100 : null,
      serverSeed: isRevealed ? round.serverSeed : null,
      startedAt: round.startedAt?.toISOString() ?? null,
      endedAt: round.crashedAt?.toISOString() ?? null,
      bets: round.bets.map((b) => this.toBetDto(b, round.id)),
    };
  }

  private toBetDto(bet: Bet, roundId: string) {
    return {
      id: bet.id,
      playerId: bet.playerId,
      username: bet.username,
      amount: Number(bet.amountCents),
      status: this.mapStatus(bet.status),
      ...(bet.cashedOutAtX100 != null && { cashoutMultiplier: bet.cashedOutAtX100 / 100 }),
      ...(bet.payoutCents != null && { payout: Number(bet.payoutCents) }),
      roundId,
    };
  }

  private toPlayerBetDto(b: PlayerBetRecord) {
    return {
      id: b.id,
      playerId: b.playerId,
      username: b.username,
      amount: Number(b.amountCents),
      status: this.mapStatus(b.status),
      ...(b.cashedOutAtX100 != null && { cashoutMultiplier: b.cashedOutAtX100 / 100 }),
      ...(b.payoutCents != null && { payout: Number(b.payoutCents) }),
      roundId: b.roundId,
    };
  }

  private mapPhase(phase: RoundPhase): string {
    switch (phase) {
      case RoundPhase.BETTING: return "betting";
      case RoundPhase.RUNNING: return "running";
      case RoundPhase.CRASHED:
      case RoundPhase.FINISHED: return "crashed";
    }
  }

  private mapStatus(status: string): string {
    switch (status) {
      case BetStatus.WON: return "won";
      case BetStatus.LOST: return "lost";
      default: return "pending";
    }
  }
}
