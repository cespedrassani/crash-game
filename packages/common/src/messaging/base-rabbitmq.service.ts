import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import * as amqplib from "amqplib";

@Injectable()
export abstract class BaseRabbitMQService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name);
  protected connection!: amqplib.ChannelModel;
  protected channel!: amqplib.Channel;

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

  protected abstract setupTopology(): Promise<void>;

  protected abstract getPublishExchange(): string;

  async publish(routingKey: string, message: object): Promise<void> {
    const content = Buffer.from(JSON.stringify(message));
    this.channel.publish(this.getPublishExchange(), routingKey, content, { persistent: true });
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
