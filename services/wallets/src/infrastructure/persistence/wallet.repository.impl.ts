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
    const data = await this.prisma.wallet.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const data = await this.prisma.wallet.findUnique({ where: { playerId } });
    return data ? this.toDomain(data) : null;
  }

  async save(wallet: Wallet): Promise<void> {
    const newTxs = wallet.newTransactions;

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
      ...(newTxs.length > 0
        ? [
            this.prisma.walletTransaction.createMany({
              data: newTxs.map((t) => ({
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
          ]
        : []),
    ]);
  }

  private toDomain(data: {
    id: string;
    playerId: string;
    username: string;
    balanceCents: bigint;
    createdAt: Date;
    updatedAt: Date;
  }): Wallet {
    const walletData: WalletData = {
      id: data.id,
      playerId: data.playerId,
      username: data.username,
      balanceCents: data.balanceCents,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Wallet.reconstitute(walletData);
  }
}
