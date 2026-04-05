import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as amqplib from "amqplib";
import { EXCHANGES, QUEUES, WalletEventTypes } from "@crash/events";

export { EXCHANGES, QUEUES };
export const ROUTING_KEYS = WalletEventTypes;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection!: amqplib.ChannelModel;
  private channel!: amqplib.Channel;
  private readyResolve!: () => void;
  private readonly ready = new Promise<void>((resolve) => {
    this.readyResolve = resolve;
  });

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
    this.readyResolve();
    this.logger.log("RabbitMQ connected");
  }

  private async setupTopology(): Promise<void> {
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

    await this.channel.bindQueue(
      QUEUES.GAMES_REPLIES,
      EXCHANGES.WALLETS,
      ROUTING_KEYS.DEBIT_CONFIRMED,
    );
    await this.channel.bindQueue(
      QUEUES.GAMES_REPLIES,
      EXCHANGES.WALLETS,
      ROUTING_KEYS.DEBIT_FAILED,
    );
    await this.channel.bindQueue(
      QUEUES.GAMES_REPLIES,
      EXCHANGES.WALLETS,
      ROUTING_KEYS.CREDIT_CONFIRMED,
    );
    await this.channel.bindQueue(
      QUEUES.GAMES_REPLIES,
      EXCHANGES.WALLETS,
      ROUTING_KEYS.CREDIT_FAILED,
    );
  }

  async publish(routingKey: string, message: object): Promise<void> {
    const content = Buffer.from(JSON.stringify(message));
    this.channel.publish(EXCHANGES.GAMES, routingKey, content, { persistent: true });
  }

  async consume(
    queue: string,
    handler: (msg: amqplib.ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    await this.ready;
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
