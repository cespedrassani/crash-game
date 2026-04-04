export class PlayerAlreadyCashedOutError extends Error {
  constructor(playerId: string) {
    super(`Player ${playerId} has already cashed out`);
    this.name = "PlayerAlreadyCashedOutError";
  }
}
