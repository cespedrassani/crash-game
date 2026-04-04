import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventEnvelope, WalletDebitRequestedPayload, WalletCreditRequestedPayload, WalletEventTypes } from "@crash/events";
import { RabbitMQService, QUEUES } from "./rabbitmq.service";
import { DebitWalletHandler } from "../../application/commands/debit-wallet/debit-wallet.handler";
import { CreditWalletHandler } from "../../application/commands/credit-wallet/credit-wallet.handler";

@Injectable()
export class GameEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(GameEventsConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly debitHandler: DebitWalletHandler,
    private readonly creditHandler: CreditWalletHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitmq.consume(QUEUES.WALLETS_COMMANDS, async (msg) => {
      const envelope = this.rabbitmq.parseMessage<EventEnvelope<unknown>>(msg);

      if (envelope.metadata.version !== 1) {
        this.logger.warn(`Unsupported event version: ${envelope.metadata.version}`);
        return;
      }

      switch (envelope.metadata.eventType) {
        case WalletEventTypes.DEBIT_REQUESTED: {
          const payload = envelope.payload as WalletDebitRequestedPayload;
          await this.debitHandler.execute({
            betId: payload.betId,
            playerId: payload.playerId,
            amountCents: payload.amountCents,
          });
          break;
        }
        case WalletEventTypes.CREDIT_REQUESTED: {
          const payload = envelope.payload as WalletCreditRequestedPayload;
          await this.creditHandler.execute({
            betId: payload.betId,
            playerId: payload.playerId,
            amountCents: payload.amountCents,
            multiplierX100: payload.multiplierX100,
          });
          break;
        }
        default:
          this.logger.warn(`Unknown event type: ${envelope.metadata.eventType}`);
      }
    });

    this.logger.log("Listening for game events on wallets queue");
  }
}
