export function toPositiveInteger(value: string): number | undefined {
  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return undefined;
  }

  return numericValue;
}
