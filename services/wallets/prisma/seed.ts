import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAYER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PLAYER_USERNAME = "player";
const INITIAL_BALANCE_CENTS = BigInt(
  parseInt(process.env.INITIAL_PLAYER_BALANCE_CENTS ?? "100000"),
);

async function main() {
  const existing = await prisma.wallet.findUnique({ where: { playerId: PLAYER_ID } });
  if (existing) {
    console.log(`Seed: wallet for '${PLAYER_USERNAME}' already exists — skipping.`);
    return;
  }

  const wallet = await prisma.wallet.create({
    data: {
      playerId: PLAYER_ID,
      username: PLAYER_USERNAME,
      balanceCents: INITIAL_BALANCE_CENTS,
      transactions: {
        create: {
          type: "CREDIT",
          amountCents: INITIAL_BALANCE_CENTS,
          balanceAfterCents: INITIAL_BALANCE_CENTS,
          idempotencyKey: `seed:initial:${PLAYER_ID}`,
          description: "Initial balance (seed)",
          referenceId: "seed",
        },
      },
    },
  });

  console.log(
    `Seed: created wallet for '${PLAYER_USERNAME}' (${PLAYER_ID}) with balance R$${(Number(INITIAL_BALANCE_CENTS) / 100).toFixed(2)}`,
  );
  console.log(`       wallet id = ${wallet.id}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
