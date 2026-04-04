export class WalletNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Wallet not found: ${identifier}`);
    this.name = "WalletNotFoundError";
  }
}
