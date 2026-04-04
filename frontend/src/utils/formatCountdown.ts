export function formatCountdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.max(0, seconds)}s`;
}
