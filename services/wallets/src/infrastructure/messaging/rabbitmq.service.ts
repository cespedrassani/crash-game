import { Injectable } from "@nestjs/common";
import { BaseRabbitMQService } from "@crash/common";
import { EXCHANGES, QUEUES, WalletEventTypes } from "@crash/events";

export { EXCHANGES, QUEUES };
export const ROUTING_KEYS = WalletEventTypes;

@Injectable()
export class RabbitMQService extends BaseRabbitMQService {
  protected getPublishExchange(): string {
    return EXCHANGES.WALLETS;
  }

  protected async setupTopology(): Promise<void> {
    await this.channel.assertExchange(EXCHANGES.WALLETS, "topic", { durable: true });
    await this.channel.assertExchange(EXCHANGES.GAMES, "topic", { durable: true });

    await this.channel.assertQueue(QUEUES.WALLETS_COMMANDS_DLQ, { durable: true });
    await this.channel.assertQueue(QUEUES.WALLETS_COMMANDS, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": QUEUES.WALLETS_COMMANDS_DLQ,
      },
    });

    await this.channel.bindQueue(QUEUES.WALLETS_COMMANDS, EXCHANGES.GAMES, ROUTING_KEYS.DEBIT_REQUESTED);
    await this.channel.bindQueue(QUEUES.WALLETS_COMMANDS, EXCHANGES.GAMES, ROUTING_KEYS.CREDIT_REQUESTED);
  }
}
