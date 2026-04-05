import { Injectable } from "@nestjs/common";
import { Wallet, WalletData } from "../../domain/wallet/wallet.entity";
import type { WalletRepositoryPort } from "../../application/ports/wallet-repository.port";
import { WalletTransaction } from "../../domain/transaction/wallet-transaction.entity";
import { TransactionType } from "../../domain/transaction/transaction-type.enum";
import { PrismaService } from "./prisma.service";

@Injectable()
export class WalletRepositoryImpl implements WalletRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Wallet | null> {
    const data = await this.prisma.wallet.findUnique({
      where: { id },
      include: { transactions: { orderBy: { createdAt: "asc" } } },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const data = await this.prisma.wallet.findUnique({
      where: { playerId },
      include: { transactions: { orderBy: { createdAt: "asc" } } },
    });
    return data ? this.toDomain(data) : null;
  }

  async save(wallet: Wallet): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.wallet.upsert({
        where: { id: wallet.id },
        create: {
          id: wallet.id,
          playerId: wallet.playerId,
          username: wallet.username,
          balanceCents: wallet.balanceCents,
          createdAt: wallet.createdAt,
        },
        update: {
          balanceCents: wallet.balanceCents,
          username: wallet.username,
        },
      }),
      this.prisma.walletTransaction.createMany({
        data: wallet.transactions.map((t) => ({
          id: t.id,
          walletId: t.walletId,
          type: t.type as "DEBIT" | "CREDIT",
          amountCents: t.amountCents,
          balanceAfterCents: t.balanceAfterCents,
          idempotencyKey: t.idempotencyKey,
          description: t.description,
          referenceId: t.referenceId,
          createdAt: t.createdAt,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  private toDomain(data: {
    id: string;
    playerId: string;
    username: string;
    balanceCents: bigint;
    createdAt: Date;
    updatedAt: Date;
    transactions: Array<{
      id: string;
      walletId: string;
      type: string;
      amountCents: bigint;
      balanceAfterCents: bigint;
      idempotencyKey: string;
      description: string;
      referenceId: string;
      createdAt: Date;
    }>;
  }): Wallet {
    const transactions = data.transactions.map(
      (t) =>
        new WalletTransaction(
          t.id,
          t.walletId,
          t.type as TransactionType,
          t.amountCents,
          t.balanceAfterCents,
          t.idempotencyKey,
          t.description,
          t.referenceId,
          t.createdAt,
        ),
    );

    const walletData: WalletData = {
      id: data.id,
      playerId: data.playerId,
      username: data.username,
      balanceCents: data.balanceCents,
      transactions,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Wallet.reconstitute(walletData);
  }
}
