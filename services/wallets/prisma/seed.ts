import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_BALANCE_CENTS = BigInt(
  parseInt(process.env.INITIAL_PLAYER_BALANCE_CENTS ?? "100000"),
);

const PLAYERS = [
  { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", username: "player" },
  { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab", username: "player2" },
  { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac", username: "player3" },
];

async function seedPlayer(playerId: string, username: string) {
  const existing = await prisma.wallet.findUnique({ where: { playerId } });
  if (existing) {
    return;
  }

  await prisma.wallet.create({
    data: {
      playerId,
      username,
      balanceCents: INITIAL_BALANCE_CENTS,
      transactions: {
        create: {
          type: "CREDIT",
          amountCents: INITIAL_BALANCE_CENTS,
          balanceAfterCents: INITIAL_BALANCE_CENTS,
          idempotencyKey: `seed:initial:${playerId}`,
          description: "Initial balance (seed)",
          referenceId: "seed",
        },
      },
    },
  });
}

async function main() {
  for (const player of PLAYERS) {
    await seedPlayer(player.id, player.username);
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
