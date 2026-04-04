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
import { WalletEventPublisherPort } from "../../application/ports/wallet-event-publisher.port";

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
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.DEBIT_CONFIRMED,
        correlationId: betId,
        idempotencyKey: `debit:${betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload: {
        betId,
        playerId,
        amountCents: Number(amountCents),
        balanceAfterCents: Number(balanceAfterCents),
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
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.DEBIT_FAILED,
        correlationId: betId,
        idempotencyKey: `debit:${betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload: {
        betId,
        playerId,
        reason,
        balanceCents: Number(balanceCents),
      },
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
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.CREDIT_CONFIRMED,
        correlationId: betId,
        idempotencyKey: `credit:${betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload: {
        betId,
        playerId,
        amountCents: Number(amountCents),
        balanceAfterCents: Number(balanceAfterCents),
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
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.CREDIT_FAILED,
        correlationId: betId,
        idempotencyKey: `credit:${betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload: { betId, playerId, reason },
    };
    await this.rabbitmq.publish(ROUTING_KEYS.CREDIT_FAILED, envelope);
  }
}
