import type { SpinResult, SymbolId, SymbolIndex } from "./types";

export interface RowWin {
  row: number;
  symbolId: SymbolId;
  runLength: number;
  payout: number;
}

export function leadingRunLength(result: SpinResult, row: number): number {
  const firstSymbolId = result.reels[0]?.symbols[row];

  if (firstSymbolId === undefined) {
    return 0;
  }

  let runLength = 1;

  while (
    runLength < result.reels.length &&
    result.reels[runLength].symbols[row] === firstSymbolId
  ) {
    runLength++;
  }

  return runLength;
}

export function findRowWins(
  result: SpinResult,
  symbolsById: SymbolIndex,
): RowWin[] {
  const wins: RowWin[] = [];
  const rowCount = result.reels[0]?.symbols.length ?? 0;

  for (let row = 0; row < rowCount; row++) {
    const symbolId = result.reels[0].symbols[row];
    const runLength = leadingRunLength(result, row);

    if (runLength < 2) {
      continue;
    }

    const payout = symbolsById.get(symbolId)?.payouts[runLength] ?? 0;

    if (payout > 0) {
      wins.push({
        row,
        symbolId,
        runLength,
        payout,
      });
    }
  }

  return wins;
}

export function calculateWin(
  result: SpinResult,
  bet: number,
  symbolsById: SymbolIndex,
): number {
  let totalWin = 0;

  for (const win of findRowWins(result, symbolsById)) {
    totalWin += bet * win.payout;
  }

  return totalWin;
}
