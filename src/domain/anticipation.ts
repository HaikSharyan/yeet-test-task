import type { SpinResult, SymbolIndex } from "./types";
import { leadingRunLength } from "./winCalculator";

export function shouldAnticipate(
  result: SpinResult,
  symbolsById: SymbolIndex,
): boolean {
  const leadingReels = result.reels.length - 1;

  if (leadingReels < 2) {
    return false;
  }

  const rowCount = result.reels[0]?.symbols.length ?? 0;

  for (let row = 0; row < rowCount; row++) {
    const symbolId = result.reels[0].symbols[row];
    const symbol = symbolsById.get(symbolId);

    if (!symbol?.highValue) {
      continue;
    }

    if (leadingRunLength(result, row) >= leadingReels) {
      return true;
    }
  }

  return false;
}
