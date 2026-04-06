import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PrismaService } from "../persistence/prisma.service";
import { RabbitMQService } from "./rabbitmq.service";

const RELAY_INTERVAL_MS = 2_000;
const BATCH_SIZE = 50;

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  @Interval(RELAY_INTERVAL_MS)
  async relay(): Promise<void> {
    const messages = await this.prisma.outboxMessage.findMany({
      where: { processedAt: null },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (messages.length === 0) return;

    for (const msg of messages) {
      try {
        await this.rabbitmq.publish(msg.routingKey, msg.payload as Record<string, unknown>);
        await this.prisma.outboxMessage.update({
          where: { id: msg.id },
          data: { processedAt: new Date() },
        });
      } catch (err) {
        this.logger.error(`Failed to relay outbox message ${msg.id}: ${err}`);
      }
    }

    this.logger.debug(`Relayed ${messages.length} outbox message(s)`);
  }
}
