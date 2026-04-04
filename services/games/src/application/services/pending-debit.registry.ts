import { Injectable, Logger } from "@nestjs/common";
import { DebitFailedReason } from "@crash/events";

export interface DebitResult {
  success: boolean;
  balanceCents: number;
  reason?: DebitFailedReason;
}

interface PendingEntry {
  resolve: (result: DebitResult) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const TIMEOUT_MS = 5_000;

/**
 * Bridges async RabbitMQ debit replies back to the HTTP request awaiting them.
 * PlaceBetHandler registers a pending entry before publishing; WalletReplyConsumer
 * resolves or rejects it when the reply arrives.
 */
@Injectable()
export class PendingDebitRegistry {
  private readonly logger = new Logger(PendingDebitRegistry.name);
  private readonly pending = new Map<string, PendingEntry>();

  wait(correlationId: string): Promise<DebitResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(correlationId)) {
          this.logger.error(`Debit timed out: correlationId=${correlationId}`);
          reject(new Error("Wallet debit request timed out"));
        }
      }, TIMEOUT_MS);

      this.pending.set(correlationId, { resolve, reject, timer });
    });
  }

  resolve(correlationId: string, result: DebitResult): void {
    const entry = this.pending.get(correlationId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(correlationId);
    entry.resolve(result);
  }

  reject(correlationId: string, err: Error): void {
    const entry = this.pending.get(correlationId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(correlationId);
    entry.reject(err);
  }
}
