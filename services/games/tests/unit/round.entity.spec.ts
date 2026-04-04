import { describe, it, expect } from "bun:test";
import { Round } from "../../src/domain/round/round.entity";
import { RoundPhase } from "../../src/domain/round/round-phase.enum";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import { RoundNotInBettingPhaseError } from "../../src/domain/errors/round-not-in-betting-phase.error";
import { RoundNotRunningError } from "../../src/domain/errors/round-not-running.error";
import { PlayerAlreadyBetError } from "../../src/domain/errors/player-already-bet.error";
import { BetNotFoundError } from "../../src/domain/errors/bet-not-found.error";
import { PlayerAlreadyCashedOutError } from "../../src/domain/errors/player-already-cashed-out.error";
import { InvalidAmountError } from "../../src/domain/errors/invalid-amount.error";
import { InvalidStateTransitionError } from "../../src/domain/errors/invalid-state-transition.error";

const SERVER_SEED = "a".repeat(64);
const CLIENT_SEED = "b".repeat(36);

function createRound(): Round {
  return Round.create(SERVER_SEED, CLIENT_SEED);
}

describe("Round", () => {
  describe("create", () => {
    it("starts in BETTING phase", () => {
      const round = createRound();
      expect(round.phase).toBe(RoundPhase.BETTING);
    });

    it("has a predetermined crash point", () => {
      const round = createRound();
      expect(round.crashPoint.valueX100).toBeGreaterThanOrEqual(100);
    });

    it("serverSeedHash is SHA-256 of serverSeed", () => {
      const round = createRound();
      expect(round.serverSeedHash).toHaveLength(64);
      expect(round.serverSeedHash).not.toBe(round.serverSeed);
    });
  });

  describe("placeBet", () => {
    it("allows bet in BETTING phase", () => {
      const round = createRound();
      const bet = round.placeBet("player-1", "alice", 1000n);
      expect(bet.amountCents).toBe(1000n);
      expect(bet.status).toBe(BetStatus.PENDING);
    });

    it("rejects bet below minimum (100 cents)", () => {
      const round = createRound();
      expect(() => round.placeBet("player-1", "alice", 99n)).toThrow(InvalidAmountError);
    });

    it("rejects bet above maximum (100000 cents)", () => {
      const round = createRound();
      expect(() => round.placeBet("player-1", "alice", 100_001n)).toThrow(InvalidAmountError);
    });

    it("rejects double bet from same player", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      expect(() => round.placeBet("player-1", "alice", 1000n)).toThrow(PlayerAlreadyBetError);
    });

    it("allows different players to bet", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      round.placeBet("player-2", "bob", 2000n);
      expect(round.bets).toHaveLength(2);
    });

    it("throws when not in BETTING phase", () => {
      const round = createRound();
      round.startRound();
      expect(() => round.placeBet("player-1", "alice", 1000n)).toThrow(
        RoundNotInBettingPhaseError,
      );
    });
  });

  describe("startRound", () => {
    it("transitions to RUNNING", () => {
      const round = createRound();
      round.startRound();
      expect(round.phase).toBe(RoundPhase.RUNNING);
      expect(round.startedAt).toBeDefined();
    });

    it("throws if not in BETTING phase", () => {
      const round = createRound();
      round.startRound();
      expect(() => round.startRound()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("cashOut", () => {
    it("marks bet as WON with correct payout", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      round.startRound();

      const bet = round.cashOut("player-1", 250);

      expect(bet.status).toBe(BetStatus.WON);
      expect(bet.cashedOutAtX100).toBe(250);
      expect(bet.payoutCents).toBe(2500n);
    });

    it("payout = amountCents * multiplierX100 / 100 (integer math)", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 3333n);
      round.startRound();

      const bet = round.cashOut("player-1", 300);
      expect(bet.payoutCents).toBe((3333n * 300n) / 100n);
    });

    it("throws if player has no bet", () => {
      const round = createRound();
      round.startRound();
      expect(() => round.cashOut("player-1", 200)).toThrow(BetNotFoundError);
    });

    it("throws if player already cashed out", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      round.startRound();
      round.cashOut("player-1", 200);

      expect(() => round.cashOut("player-1", 300)).toThrow(PlayerAlreadyCashedOutError);
    });

    it("throws if round is not RUNNING", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      expect(() => round.cashOut("player-1", 150)).toThrow(RoundNotRunningError);
    });
  });

  describe("crash", () => {
    it("transitions to CRASHED and marks pending bets as LOST", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      round.placeBet("player-2", "bob", 2000n);
      round.startRound();
      round.cashOut("player-1", 200);
      round.crash();

      expect(round.phase).toBe(RoundPhase.CRASHED);
      const alice = round.getBetByPlayer("player-1");
      const bob = round.getBetByPlayer("player-2");
      expect(alice?.status).toBe(BetStatus.WON);
      expect(bob?.status).toBe(BetStatus.LOST);
    });

    it("throws if not in RUNNING phase", () => {
      const round = createRound();
      expect(() => round.crash()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("finish", () => {
    it("transitions from CRASHED to FINISHED", () => {
      const round = createRound();
      round.startRound();
      round.crash();
      round.finish();
      expect(round.phase).toBe(RoundPhase.FINISHED);
    });

    it("throws if not in CRASHED phase", () => {
      const round = createRound();
      expect(() => round.finish()).toThrow(InvalidStateTransitionError);
    });
  });

  describe("domain events", () => {
    it("raises BetPlacedEvent on placeBet", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      const events = round.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe("BetPlacedEvent");
    });

    it("pullDomainEvents clears queue", () => {
      const round = createRound();
      round.placeBet("player-1", "alice", 1000n);
      round.pullDomainEvents();
      expect(round.pullDomainEvents()).toHaveLength(0);
    });
  });
});
