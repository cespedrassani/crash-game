import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PassportModule } from "@nestjs/passport";
import { GamesController } from "./presentation/controllers/games.controller";
import { PrismaService } from "./infrastructure/persistence/prisma.service";
import { RoundRepositoryImpl } from "./infrastructure/persistence/round.repository.impl";
import { RabbitMQService } from "./infrastructure/messaging/rabbitmq.service";
import { WalletCommandsPublisher } from "./infrastructure/messaging/wallet-commands.publisher";
import { WalletReplyConsumer } from "./infrastructure/messaging/wallet-reply.consumer";
import { OutboxRelayService } from "./infrastructure/messaging/outbox-relay.service";
import { GameGateway } from "./infrastructure/websocket/game.gateway";
import { WsJwtService } from "./infrastructure/auth/ws-jwt.service";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { PendingDebitRegistry } from "./application/services/pending-debit.registry";
import { PlaceBetHandler } from "./application/commands/place-bet/place-bet.handler";
import { CashoutHandler } from "./application/commands/cashout/cashout.handler";
import { GetCurrentRoundHandler } from "./application/queries/get-current-round.handler";
import { GetRoundHistoryHandler } from "./application/queries/get-round-history.handler";
import { GetPlayerBetsHandler } from "./application/queries/get-player-bets.handler";
import { VerifyRoundHandler } from "./application/queries/verify-round.handler";
import { GameEngineService } from "./application/services/game-engine.service";
import { ROUND_REPOSITORY } from "./domain/round/round.repository.token";

@Module({
  imports: [PassportModule, ScheduleModule.forRoot()],
  controllers: [GamesController],
  providers: [
    PrismaService,
    RabbitMQService,
    WalletCommandsPublisher,
    WalletReplyConsumer,
    OutboxRelayService,
    GameGateway,
    WsJwtService,
    PendingDebitRegistry,
    JwtStrategy,
    { provide: ROUND_REPOSITORY, useClass: RoundRepositoryImpl },
    GameEngineService,
    PlaceBetHandler,
    CashoutHandler,
    GetCurrentRoundHandler,
    GetRoundHistoryHandler,
    GetPlayerBetsHandler,
    VerifyRoundHandler,
  ],
})
export class AppModule {}
