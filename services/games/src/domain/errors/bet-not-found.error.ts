export class BetNotFoundError extends Error {
  constructor(playerId: string) {
    super(`No bet found for player ${playerId} in this round`);
    this.name = "BetNotFoundError";
  }
}
