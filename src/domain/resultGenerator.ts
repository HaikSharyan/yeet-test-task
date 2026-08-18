import type { RandomSource } from "../core/random";
import { pickWeighted } from "../core/random";
import type { SpinResult, SymbolDefinition } from "./types";

export function generateResult(
  reelCount: number,
  symbols: readonly SymbolDefinition[],
  random: RandomSource = Math.random,
): SpinResult {
  const reels: number[] = [];

  for (let reel = 0; reel < reelCount; reel++) {
    console.log("generateResult", random);
    reels.push(pickWeighted(symbols, random).id);
  }

  return { reels };
}
