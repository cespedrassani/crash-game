import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as amqplib from "amqplib";
import { EXCHANGES, QUEUES, WalletEventTypes } from "@crash/events";

export { EXCHANGES, QUEUES };
export const ROUTING_KEYS = WalletEventTypes;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection!: amqplib.Connection;
  private channel!: amqplib.Channel;

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<void> {
    this.connection = await amqplib.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(1);
    await this.setupTopology();
    this.logger.log("RabbitMQ connected");
  }

  private async setupTopology(): Promise<void> {
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

    await this.channel.bindQueue(
      QUEUES.WALLETS_COMMANDS,
      EXCHANGES.GAMES,
      ROUTING_KEYS.DEBIT_REQUESTED,
    );
    await this.channel.bindQueue(
      QUEUES.WALLETS_COMMANDS,
      EXCHANGES.GAMES,
      ROUTING_KEYS.CREDIT_REQUESTED,
    );
  }

  async publish(routingKey: string, message: object): Promise<void> {
    const content = Buffer.from(JSON.stringify(message));
    this.channel.publish(EXCHANGES.WALLETS, routingKey, content, { persistent: true });
  }

  async consume(
    queue: string,
    handler: (msg: amqplib.ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(msg);
        this.channel.ack(msg);
      } catch (err) {
        this.logger.error(`Failed to process message: ${(err as Error).message}`);
        this.channel.nack(msg, false, false);
      }
    });
  }

  parseMessage<T>(msg: amqplib.ConsumeMessage): T {
    return JSON.parse(msg.content.toString()) as T;
  }
}
