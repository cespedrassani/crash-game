import { describe, it, expect } from "bun:test";
import { Wallet } from "../../src/domain/wallet/wallet.entity";
import { Money } from "../../src/domain/value-objects/money.vo";
import { TransactionType } from "../../src/domain/transaction/transaction-type.enum";
import { InsufficientFundsError } from "../../src/domain/errors/insufficient-funds.error";
import { InvalidAmountError } from "../../src/domain/errors/invalid-amount.error";
import { WalletCreatedEvent } from "../../src/domain/events/wallet-created.event";
import { WalletDebitedEvent } from "../../src/domain/events/wallet-debited.event";
import { WalletCreditedEvent } from "../../src/domain/events/wallet-credited.event";

describe("Wallet", () => {
  describe("create", () => {
    it("creates with zero balance", () => {
      const wallet = Wallet.create("player-1", "testuser");
      expect(wallet.balanceCents).toBe(0n);
      expect(wallet.playerId).toBe("player-1");
      expect(wallet.username).toBe("testuser");
    });

    it("raises WalletCreatedEvent", () => {
      const wallet = Wallet.create("player-1", "testuser");
      const events = wallet.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WalletCreatedEvent);
    });

    it("pullDomainEvents clears the queue", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.pullDomainEvents();
      expect(wallet.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("debit", () => {
    it("debits balance and creates transaction", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(10000n), "seed", "Initial credit", "ref-0");
      wallet.pullDomainEvents();

      wallet.debit(Money.of(3000n), "key-1", "Bet #1", "bet-1");

      expect(wallet.balanceCents).toBe(7000n);
      expect(wallet.transactions).toHaveLength(2);
      expect(wallet.transactions[1].type).toBe(TransactionType.DEBIT);
      expect(wallet.transactions[1].amountCents).toBe(3000n);
      expect(wallet.transactions[1].balanceAfterCents).toBe(7000n);
    });

    it("raises WalletDebitedEvent", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(5000n), "seed", "Credit", "ref-0");
      wallet.pullDomainEvents();

      wallet.debit(Money.of(1000n), "key-1", "Bet", "bet-1");
      const events = wallet.pullDomainEvents();

      expect(events[0]).toBeInstanceOf(WalletDebitedEvent);
      const event = events[0] as WalletDebitedEvent;
      expect(event.amountCents).toBe(1000n);
      expect(event.balanceAfterCents).toBe(4000n);
    });

    it("throws InsufficientFundsError when balance is too low", () => {
      const wallet = Wallet.create("player-1", "testuser");
      expect(() =>
        wallet.debit(Money.of(100n), "key-1", "Bet", "bet-1"),
      ).toThrow(InsufficientFundsError);
    });

    it("throws InvalidAmountError on zero debit", () => {
      const wallet = Wallet.create("player-1", "testuser");
      expect(() =>
        wallet.debit(Money.of(0n), "key-1", "Bet", "bet-1"),
      ).toThrow(InvalidAmountError);
    });

    it("balance never goes negative", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(100n), "seed", "Credit", "ref-0");

      expect(() =>
        wallet.debit(Money.of(101n), "key-1", "Bet", "bet-1"),
      ).toThrow(InsufficientFundsError);

      expect(wallet.balanceCents).toBe(100n);
    });
  });

  describe("credit", () => {
    it("credits balance and creates transaction", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(5000n), "key-1", "Cashout", "bet-1");

      expect(wallet.balanceCents).toBe(5000n);
      expect(wallet.transactions[0].type).toBe(TransactionType.CREDIT);
      expect(wallet.transactions[0].balanceAfterCents).toBe(5000n);
    });

    it("raises WalletCreditedEvent", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.pullDomainEvents();

      wallet.credit(Money.of(2500n), "key-1", "Cashout", "bet-1");
      const events = wallet.pullDomainEvents();

      expect(events[0]).toBeInstanceOf(WalletCreditedEvent);
    });

    it("throws on zero credit", () => {
      const wallet = Wallet.create("player-1", "testuser");
      expect(() =>
        wallet.credit(Money.of(0n), "key-1", "Cashout", "bet-1"),
      ).toThrow(InvalidAmountError);
    });
  });

  describe("idempotency key stored on transaction", () => {
    it("idempotencyKey is persisted on transaction", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(5000n), "debit:bet-abc", "Bet", "bet-abc");
      expect(wallet.transactions[0].idempotencyKey).toBe("debit:bet-abc");
    });
  });

  describe("monetary precision", () => {
    it("handles large amounts without floating point errors", () => {
      const wallet = Wallet.create("player-1", "testuser");
      wallet.credit(Money.of(999_999_999n), "seed", "Credit", "ref-0");
      wallet.debit(Money.of(333_333_333n), "key-1", "Debit", "ref-1");
      expect(wallet.balanceCents).toBe(666_666_666n);
    });
  });
});
