export function roundPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatPercent(value: number): string {
  return `${roundPercent(value)}%`;
}
