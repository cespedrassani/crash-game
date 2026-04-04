import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { GamesController } from "./presentation/controllers/games.controller";
import { PrismaService } from "./infrastructure/persistence/prisma.service";
import { RoundRepositoryImpl } from "./infrastructure/persistence/round.repository.impl";
import { RabbitMQService } from "./infrastructure/messaging/rabbitmq.service";
import { WalletCommandsPublisher } from "./infrastructure/messaging/wallet-commands.publisher";
import { WalletReplyConsumer } from "./infrastructure/messaging/wallet-reply.consumer";
import { GameGateway } from "./infrastructure/websocket/game.gateway";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { PendingDebitRegistry } from "./application/services/pending-debit.registry";
import { PlaceBetHandler } from "./application/commands/place-bet/place-bet.handler";
import { CashoutHandler } from "./application/commands/cashout/cashout.handler";
import { GetCurrentRoundHandler } from "./application/queries/get-current-round.handler";
import { GetRoundHistoryHandler } from "./application/queries/get-round-history.handler";
import { GetPlayerBetsHandler } from "./application/queries/get-player-bets.handler";
import { VerifyRoundHandler } from "./application/queries/verify-round.handler";
import { GameEngineService } from "./application/services/game-engine.service";

@Module({
  imports: [PassportModule],
  controllers: [GamesController],
  providers: [
    PrismaService,
    RabbitMQService,
    WalletCommandsPublisher,
    WalletReplyConsumer,
    GameGateway,
    PendingDebitRegistry,
    JwtStrategy,
    {
      provide: RoundRepositoryImpl,
      useFactory: (prisma: PrismaService) => new RoundRepositoryImpl(prisma),
      inject: [PrismaService],
    },
    {
      provide: GameEngineService,
      useFactory: (
        repo: RoundRepositoryImpl,
        gateway: GameGateway,
        publisher: WalletCommandsPublisher,
      ) => new GameEngineService(repo, gateway, publisher),
      inject: [RoundRepositoryImpl, GameGateway, WalletCommandsPublisher],
    },
    {
      provide: PlaceBetHandler,
      useFactory: (
        repo: RoundRepositoryImpl,
        publisher: WalletCommandsPublisher,
        gateway: GameGateway,
        pendingDebits: PendingDebitRegistry,
      ) => new PlaceBetHandler(repo, publisher, gateway, pendingDebits),
      inject: [RoundRepositoryImpl, WalletCommandsPublisher, GameGateway, PendingDebitRegistry],
    },
    {
      provide: CashoutHandler,
      useFactory: (
        repo: RoundRepositoryImpl,
        publisher: WalletCommandsPublisher,
        gateway: GameGateway,
        engine: GameEngineService,
      ) => new CashoutHandler(repo, publisher, gateway, engine),
      inject: [RoundRepositoryImpl, WalletCommandsPublisher, GameGateway, GameEngineService],
    },
    {
      provide: GetCurrentRoundHandler,
      useFactory: (repo: RoundRepositoryImpl, engine: GameEngineService) =>
        new GetCurrentRoundHandler(repo, engine),
      inject: [RoundRepositoryImpl, GameEngineService],
    },
    {
      provide: GetRoundHistoryHandler,
      useFactory: (repo: RoundRepositoryImpl) => new GetRoundHistoryHandler(repo),
      inject: [RoundRepositoryImpl],
    },
    {
      provide: GetPlayerBetsHandler,
      useFactory: (prisma: PrismaService) => new GetPlayerBetsHandler(prisma),
      inject: [PrismaService],
    },
    {
      provide: VerifyRoundHandler,
      useFactory: (repo: RoundRepositoryImpl) => new VerifyRoundHandler(repo),
      inject: [RoundRepositoryImpl],
    },
  ],
})
export class AppModule {}
