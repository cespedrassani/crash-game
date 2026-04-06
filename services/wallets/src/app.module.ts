import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PassportModule } from "@nestjs/passport";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { PrismaService } from "./infrastructure/persistence/prisma.service";
import { WalletRepositoryImpl } from "./infrastructure/persistence/wallet.repository.impl";
import { WalletTransactionRepositoryImpl } from "./infrastructure/persistence/wallet-transaction.repository.impl";
import { RabbitMQService } from "./infrastructure/messaging/rabbitmq.service";
import { WalletReplyPublisher } from "./infrastructure/messaging/wallet-reply.publisher";
import { GameEventsConsumer } from "./infrastructure/messaging/game-events.consumer";
import { OutboxRelayService } from "./infrastructure/messaging/outbox-relay.service";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { CreateWalletHandler } from "./application/commands/create-wallet/create-wallet.handler";
import { DebitWalletHandler } from "./application/commands/debit-wallet/debit-wallet.handler";
import { CreditWalletHandler } from "./application/commands/credit-wallet/credit-wallet.handler";
import { DepositWalletHandler } from "./application/commands/deposit-wallet/deposit-wallet.handler";
import { GetMyWalletHandler } from "./application/queries/get-my-wallet.handler";
import { WALLET_REPOSITORY } from "./application/ports/wallet-repository.port";
import { WALLET_TRANSACTION_REPOSITORY } from "./application/ports/wallet-transaction-repository.port";
import { WALLET_EVENT_PUBLISHER } from "./application/ports/wallet-event-publisher.port";

@Module({
  imports: [PassportModule, ScheduleModule.forRoot()],
  controllers: [WalletsController],
  providers: [
    PrismaService,
    RabbitMQService,
    GameEventsConsumer,
    OutboxRelayService,
    JwtStrategy,
    { provide: WALLET_REPOSITORY, useClass: WalletRepositoryImpl },
    { provide: WALLET_TRANSACTION_REPOSITORY, useClass: WalletTransactionRepositoryImpl },
    { provide: WALLET_EVENT_PUBLISHER, useClass: WalletReplyPublisher },
    CreateWalletHandler,
    DebitWalletHandler,
    CreditWalletHandler,
    DepositWalletHandler,
    GetMyWalletHandler,
  ],
})
export class AppModule {}
