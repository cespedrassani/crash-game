import { Injectable } from "@nestjs/common";
import { WalletTransactionRepositoryPort } from "../../application/ports/wallet-transaction-repository.port";
import { PrismaService } from "./prisma.service";

@Injectable()
export class WalletTransactionRepositoryImpl implements WalletTransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async existsByIdempotencyKey(idempotencyKey: string): Promise<boolean> {
    const count = await this.prisma.walletTransaction.count({
      where: { idempotencyKey },
    });
    return count > 0;
  }
}
