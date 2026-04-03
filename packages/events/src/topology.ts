export const EXCHANGES = {
  GAMES: "crash.games.exchange",
  WALLETS: "crash.wallets.exchange",
} as const;

export const QUEUES = {
  WALLETS_COMMANDS: "crash.wallets.commands",
  WALLETS_COMMANDS_DLQ: "crash.wallets.commands.dlq",
  GAMES_REPLIES: "crash.games.replies",
  GAMES_REPLIES_DLQ: "crash.games.replies.dlq",
} as const;
