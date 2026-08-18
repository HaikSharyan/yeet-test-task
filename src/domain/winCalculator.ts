import type { SpinResult, SymbolIndex } from "./types";

function leadingMatchCount(result: SpinResult): number {
  const firstSymbolId = result.reels[0];

  if (firstSymbolId === undefined) {
    return 0;
  }

  let matchCount = 1;

  while (
    matchCount < result.reels.length &&
    result.reels[matchCount] === firstSymbolId
  ) {
    matchCount++;
  }

  return matchCount;
}

export function calculateWin(
  result: SpinResult,
  bet: number,
  symbolsById: SymbolIndex,
): number {
  const firstSymbolId = result.reels[0];

  if (firstSymbolId === undefined) {
    return 0;
  }

  const symbol = symbolsById.get(firstSymbolId);

  if (!symbol) {
    return 0;
  }

  const matchCount = leadingMatchCount(result);
  const multiplier = symbol.payouts[matchCount] ?? 0;

  return bet * multiplier;
}
