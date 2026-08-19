import type { RandomSource } from "../core/random";
import { pickWeighted } from "../core/random";
import type { ReelResult, SpinResult, SymbolDefinition } from "./types";

export function generateResult(
  reelCount: number,
  rowCount: number,
  symbols: readonly SymbolDefinition[],
  random: RandomSource = Math.random,
): SpinResult {
  const reels: ReelResult[] = [];

  for (let reel = 0; reel < reelCount; reel++) {
    const rowSymbols: number[] = [];

    for (let row = 0; row < rowCount; row++) {
      rowSymbols.push(pickWeighted(symbols, random).id);
    }

    reels.push({
      symbols: rowSymbols,
    });
  }

  return { reels };
}
