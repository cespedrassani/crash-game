import { Injectable } from "@nestjs/common";
import { BaseRabbitMQService } from "@crash/common";
import { EXCHANGES, QUEUES, WalletEventTypes } from "@crash/events";

export { EXCHANGES, QUEUES };
export const ROUTING_KEYS = WalletEventTypes;

@Injectable()
export class RabbitMQService extends BaseRabbitMQService {
  protected getPublishExchange(): string {
    return EXCHANGES.GAMES;
  }

  protected async setupTopology(): Promise<void> {
    await this.channel.assertExchange(EXCHANGES.GAMES, "topic", { durable: true });
    await this.channel.assertExchange(EXCHANGES.WALLETS, "topic", { durable: true });

    await this.channel.assertQueue(QUEUES.GAMES_REPLIES_DLQ, { durable: true });
    await this.channel.assertQueue(QUEUES.GAMES_REPLIES, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": QUEUES.GAMES_REPLIES_DLQ,
      },
    });

    await this.channel.bindQueue(QUEUES.GAMES_REPLIES, EXCHANGES.WALLETS, ROUTING_KEYS.DEBIT_CONFIRMED);
    await this.channel.bindQueue(QUEUES.GAMES_REPLIES, EXCHANGES.WALLETS, ROUTING_KEYS.DEBIT_FAILED);
    await this.channel.bindQueue(QUEUES.GAMES_REPLIES, EXCHANGES.WALLETS, ROUTING_KEYS.CREDIT_CONFIRMED);
    await this.channel.bindQueue(QUEUES.GAMES_REPLIES, EXCHANGES.WALLETS, ROUTING_KEYS.CREDIT_FAILED);
  }
}
