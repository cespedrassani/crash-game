import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  EventEnvelope,
  WalletDebitConfirmedPayload,
  WalletDebitFailedPayload,
  WalletCreditConfirmedPayload,
  WalletCreditFailedPayload,
  WalletEventTypes,
  DebitFailedReason,
  CreditFailedReason,
} from "@crash/events";
import { RabbitMQService, ROUTING_KEYS } from "./rabbitmq.service";
import type { WalletEventPublisherPort } from "../../application/ports/wallet-event-publisher.port";

@Injectable()
export class WalletReplyPublisher implements WalletEventPublisherPort {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async publishDebitConfirmed(
    betId: string,
    playerId: string,
    amountCents: bigint,
    balanceAfterCents: bigint,
  ): Promise<void> {
    const envelope: EventEnvelope<WalletDebitConfirmedPayload> = {
      metadata: this.buildMetadata(WalletEventTypes.DEBIT_CONFIRMED, betId, `debit:${betId}`),
      payload: {
        betId,
        playerId,
        amountCents: Number(amountCents),
        balanceAfterCents: balanceAfterCents.toString(),
      },
    };
    await this.rabbitmq.publish(ROUTING_KEYS.DEBIT_CONFIRMED, envelope);
  }

  async publishDebitFailed(
    betId: string,
    playerId: string,
    reason: DebitFailedReason,
    balanceCents: bigint,
  ): Promise<void> {
    const envelope: EventEnvelope<WalletDebitFailedPayload> = {
      metadata: this.buildMetadata(WalletEventTypes.DEBIT_FAILED, betId, `debit:${betId}`),
      payload: { betId, playerId, reason, balanceCents: balanceCents.toString() },
    };
    await this.rabbitmq.publish(ROUTING_KEYS.DEBIT_FAILED, envelope);
  }

  async publishCreditConfirmed(
    betId: string,
    playerId: string,
    amountCents: bigint,
    balanceAfterCents: bigint,
  ): Promise<void> {
    const envelope: EventEnvelope<WalletCreditConfirmedPayload> = {
      metadata: this.buildMetadata(WalletEventTypes.CREDIT_CONFIRMED, betId, `credit:${betId}`),
      payload: {
        betId,
        playerId,
        amountCents: Number(amountCents),
        balanceAfterCents: balanceAfterCents.toString(),
      },
    };
    await this.rabbitmq.publish(ROUTING_KEYS.CREDIT_CONFIRMED, envelope);
  }

  async publishCreditFailed(
    betId: string,
    playerId: string,
    reason: CreditFailedReason,
  ): Promise<void> {
    const envelope: EventEnvelope<WalletCreditFailedPayload> = {
      metadata: this.buildMetadata(WalletEventTypes.CREDIT_FAILED, betId, `credit:${betId}`),
      payload: { betId, playerId, reason },
    };
    await this.rabbitmq.publish(ROUTING_KEYS.CREDIT_FAILED, envelope);
  }

  private buildMetadata(eventType: string, correlationId: string, idempotencyKey: string) {
    return {
      eventId: randomUUID(),
      eventType,
      correlationId,
      idempotencyKey,
      occurredAt: new Date().toISOString(),
      version: 1 as const,
    };
  }
}
