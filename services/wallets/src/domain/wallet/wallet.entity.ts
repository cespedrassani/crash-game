import { randomUUID } from "node:crypto";
import { Money } from "../value-objects/money.vo";
import { WalletTransaction } from "../transaction/wallet-transaction.entity";
import { TransactionType } from "../transaction/transaction-type.enum";
import { DomainEvent } from "../events/domain-event";
import { WalletCreatedEvent } from "../events/wallet-created.event";
import { WalletDebitedEvent } from "../events/wallet-debited.event";
import { WalletCreditedEvent } from "../events/wallet-credited.event";
import { InsufficientFundsError } from "../errors/insufficient-funds.error";
import { InvalidAmountError } from "../errors/invalid-amount.error";

export interface WalletData {
  id: string;
  playerId: string;
  username: string;
  balanceCents: bigint;
  transactions: WalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export class Wallet {
  private _balanceCents: bigint;
  private readonly _transactions: WalletTransaction[];
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(
    readonly id: string,
    readonly playerId: string,
    readonly username: string,
    balanceCents: bigint,
    transactions: WalletTransaction[],
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._balanceCents = balanceCents;
    this._transactions = transactions;
    this._updatedAt = updatedAt;
    this._domainEvents = [];
  }

  static create(playerId: string, username: string): Wallet {
    const id = randomUUID();
    const now = new Date();
    const wallet = new Wallet(id, playerId, username, 0n, [], now, now);
    wallet._domainEvents.push(new WalletCreatedEvent(id, playerId, username));
    return wallet;
  }

  static reconstitute(data: WalletData): Wallet {
    return new Wallet(
      data.id,
      data.playerId,
      data.username,
      data.balanceCents,
      data.transactions,
      data.createdAt,
      data.updatedAt,
    );
  }

  get balanceCents(): bigint {
    return this._balanceCents;
  }

  get transactions(): readonly WalletTransaction[] {
    return this._transactions;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  debit(
    amount: Money,
    idempotencyKey: string,
    description: string,
    referenceId: string,
  ): WalletTransaction {
    if (amount.isZero()) {
      throw new InvalidAmountError("Debit amount must be greater than zero");
    }
    if (this._balanceCents < amount.cents) {
      throw new InsufficientFundsError(this._balanceCents, amount.cents);
    }

    this._balanceCents -= amount.cents;
    const now = new Date();
    this._updatedAt = now;

    const transaction = new WalletTransaction(
      randomUUID(),
      this.id,
      TransactionType.DEBIT,
      amount.cents,
      this._balanceCents,
      idempotencyKey,
      description,
      referenceId,
      now,
    );

    this._transactions.push(transaction);
    this._domainEvents.push(
      new WalletDebitedEvent(
        this.id,
        this.playerId,
        amount.cents,
        this._balanceCents,
        idempotencyKey,
        referenceId,
      ),
    );

    return transaction;
  }

  credit(
    amount: Money,
    idempotencyKey: string,
    description: string,
    referenceId: string,
  ): WalletTransaction {
    if (amount.isZero()) {
      throw new InvalidAmountError("Credit amount must be greater than zero");
    }

    this._balanceCents += amount.cents;
    const now = new Date();
    this._updatedAt = now;

    const transaction = new WalletTransaction(
      randomUUID(),
      this.id,
      TransactionType.CREDIT,
      amount.cents,
      this._balanceCents,
      idempotencyKey,
      description,
      referenceId,
      now,
    );

    this._transactions.push(transaction);
    this._domainEvents.push(
      new WalletCreditedEvent(
        this.id,
        this.playerId,
        amount.cents,
        this._balanceCents,
        idempotencyKey,
        referenceId,
      ),
    );

    return transaction;
  }

  currentBalance(): Money {
    return Money.of(this._balanceCents);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}
