import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  EventEnvelope,
  WalletDebitRequestedPayload,
  WalletCreditRequestedPayload,
  WalletEventTypes,
} from "@crash/events";
import { RabbitMQService, ROUTING_KEYS } from "./rabbitmq.service";

@Injectable()
export class WalletCommandsPublisher {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async publishDebitRequested(payload: WalletDebitRequestedPayload): Promise<void> {
    const envelope: EventEnvelope<WalletDebitRequestedPayload> = {
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.DEBIT_REQUESTED,
        correlationId: payload.betId,
        idempotencyKey: `debit:${payload.betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload,
    };
    await this.rabbitmq.publish(ROUTING_KEYS.DEBIT_REQUESTED, envelope);
  }

  async publishCreditRequested(payload: WalletCreditRequestedPayload): Promise<void> {
    const envelope: EventEnvelope<WalletCreditRequestedPayload> = {
      metadata: {
        eventId: randomUUID(),
        eventType: WalletEventTypes.CREDIT_REQUESTED,
        correlationId: payload.betId,
        idempotencyKey: `credit:${payload.betId}`,
        occurredAt: new Date().toISOString(),
        version: 1,
      },
      payload,
    };
    await this.rabbitmq.publish(ROUTING_KEYS.CREDIT_REQUESTED, envelope);
  }
}
