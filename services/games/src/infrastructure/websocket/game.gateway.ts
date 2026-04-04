import { Injectable, Logger } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

export interface BettingPhasePayload {
  roundId: string;
  serverSeedHash: string;
  clientSeed: string;
  endsAt: string;
}

export interface RoundStartedPayload {
  roundId: string;
  startedAt: string;
}

export interface TickPayload {
  multiplierX100: number;
  elapsedMs: number;
}

export interface RoundCrashedPayload {
  roundId: string;
  crashPointX100: number;
  serverSeed: string;
}

export interface BetPlacedPayload {
  betId: string;
  playerId: string;
  username: string;
  amountCents: string;
}

export interface BetCashedOutPayload {
  betId: string;
  playerId: string;
  username: string;
  multiplierX100: number;
  payoutCents: string;
}

interface SnapshotBet {
  playerId: string;
  username: string;
  amount: number;
  status: "pending" | "won" | "lost";
  cashoutMultiplier?: number;
  payout?: number;
}


interface RoundSnapshot {
  roundId: string;
  phase: "betting" | "running" | "crashed";
  seedHash: string;
  multiplier: number;
  bettingEndsAt: string | null;
  crashPoint: number | null;
  serverSeed: string | null;
  bets: SnapshotBet[];
}

@Injectable()
@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private snapshot: RoundSnapshot | null = null;

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);

    const token = client.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8"),
          ) as { sub?: string };
          if (payload.sub) {
            void client.join(`player:${payload.sub}`);
          }
        }
      } catch {
        this.logger.warn(`Failed to decode JWT for client ${client.id}`);
      }
    }

    if (this.snapshot) {
      const s = this.snapshot;
      const timeLeft =
        s.phase === "betting" && s.bettingEndsAt
          ? Math.max(0, new Date(s.bettingEndsAt).getTime() - Date.now())
          : null;
      client.emit("round:state", {
        roundId: s.roundId,
        phase: s.phase,
        multiplier: s.multiplier,
        timeLeft,
        seedHash: s.seedHash,
        bets: s.bets,
      });
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitBettingPhase(payload: BettingPhasePayload): void {
    const timeLeft = new Date(payload.endsAt).getTime() - Date.now();
    this.snapshot = {
      roundId: payload.roundId,
      phase: "betting",
      seedHash: payload.serverSeedHash,
      multiplier: 1.0,
      bettingEndsAt: payload.endsAt,
      crashPoint: null,
      serverSeed: null,
      bets: [],
    };
    this.server.emit("round:betting", {
      roundId: payload.roundId,
      seedHash: payload.serverSeedHash,
      timeLeft,
    });
  }

  emitRoundStarted(payload: RoundStartedPayload): void {
    if (this.snapshot) {
      this.snapshot.phase = "running";
      this.snapshot.bettingEndsAt = null;
    }
    this.server.emit("round:started", { roundId: payload.roundId });
  }

  emitTick(payload: TickPayload): void {
    const multiplier = payload.multiplierX100 / 100;
    if (this.snapshot) {
      this.snapshot.multiplier = multiplier;
    }
    this.server.emit("round:tick", { multiplier });
  }

  emitRoundCrashed(payload: RoundCrashedPayload): void {
    const crashPoint = payload.crashPointX100 / 100;
    if (this.snapshot) {
      this.snapshot.phase = "crashed";
      this.snapshot.crashPoint = crashPoint;
      this.snapshot.serverSeed = payload.serverSeed;
      this.snapshot.multiplier = crashPoint;
      for (const bet of this.snapshot.bets) {
        if (bet.status === "pending") {
          bet.status = "lost";
        }
      }
    }
    this.server.emit("round:crashed", {
      roundId: payload.roundId,
      crashPoint,
      serverSeed: payload.serverSeed,
    });
  }

  emitBetPlaced(payload: BetPlacedPayload): void {
    const amount = Number(payload.amountCents);
    if (this.snapshot) {
      this.snapshot.bets.push({
        playerId: payload.playerId,
        username: payload.username,
        amount,
        status: "pending",
      });
    }
    this.server.emit("round:bet", {
      playerId: payload.playerId,
      username: payload.username,
      amount,
    });
  }

  emitBetCashedOut(payload: BetCashedOutPayload): void {
    const multiplier = payload.multiplierX100 / 100;
    const payout = Number(payload.payoutCents);
    if (this.snapshot) {
      const bet = this.snapshot.bets.find((b) => b.playerId === payload.playerId);
      if (bet) {
        bet.status = "won";
        bet.cashoutMultiplier = multiplier;
        bet.payout = payout;
      }
    }
    this.server.emit("round:cashout", {
      playerId: payload.playerId,
      username: payload.username,
      multiplier,
      payout,
    });
  }

  emitWalletUpdated(playerId: string, balanceCents: number): void {
    this.server.to(`player:${playerId}`).emit("wallet:updated", {
      balance: balanceCents,
    });
  }
}
