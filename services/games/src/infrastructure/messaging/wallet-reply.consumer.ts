import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  EventEnvelope,
  WalletDebitConfirmedPayload,
  WalletDebitFailedPayload,
  WalletCreditConfirmedPayload,
  WalletCreditFailedPayload,
  WalletEventTypes,
} from "@crash/events";
import { RabbitMQService, QUEUES } from "./rabbitmq.service";
import { GameGateway } from "../websocket/game.gateway";
import { PendingDebitRegistry } from "../../application/services/pending-debit.registry";

@Injectable()
export class WalletReplyConsumer implements OnModuleInit {
  private readonly logger = new Logger(WalletReplyConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly gateway: GameGateway,
    private readonly pendingDebits: PendingDebitRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitmq.consume(QUEUES.GAMES_REPLIES, async (msg) => {
      const envelope = this.rabbitmq.parseMessage<EventEnvelope<unknown>>(msg);

      if (envelope.metadata.version !== 1) {
        this.logger.warn(`Unsupported event version: ${envelope.metadata.version}`);
        return;
      }

      switch (envelope.metadata.eventType) {
        case WalletEventTypes.DEBIT_CONFIRMED: {
          const payload = envelope.payload as WalletDebitConfirmedPayload;
          this.logger.log(`Debit confirmed: betId=${payload.betId}`);
          this.pendingDebits.resolve(payload.betId, {
            success: true,
            balanceCents: payload.balanceAfterCents,
          });
          this.gateway.emitWalletUpdated(payload.playerId, payload.balanceAfterCents);
          break;
        }
        case WalletEventTypes.DEBIT_FAILED: {
          const payload = envelope.payload as WalletDebitFailedPayload;
          this.logger.warn(`Debit failed: betId=${payload.betId} reason=${payload.reason}`);
          this.pendingDebits.resolve(payload.betId, {
            success: false,
            balanceCents: payload.balanceCents,
            reason: payload.reason,
          });
          break;
        }
        case WalletEventTypes.CREDIT_CONFIRMED: {
          const payload = envelope.payload as WalletCreditConfirmedPayload;
          this.logger.log(
            `Cashout credit confirmed: betId=${payload.betId} amount=${payload.amountCents}`,
          );
          this.gateway.emitWalletUpdated(payload.playerId, payload.balanceAfterCents);
          break;
        }
        case WalletEventTypes.CREDIT_FAILED: {
          const payload = envelope.payload as WalletCreditFailedPayload;
          this.logger.error(
            `Cashout credit FAILED: betId=${payload.betId} reason=${payload.reason} — manual intervention required`,
          );
          break;
        }
        default:
          this.logger.debug(`Ignored event type: ${envelope.metadata.eventType}`);
      }
    });

    this.logger.log("Listening for wallet replies on games queue");
  }
}
