import { symbols } from "./symbols";
import type { GameConfig } from "./types";

export const gameConfig = {
  reels: 3,
  symbols,
  betOptions: [1, 2, 5, 10],
  initialBalance: 100,
  spinDuration: 500,
  reel: {
    width: 150,
    symbolHeight: 170,
    gap: 16,
  },
  theme: {
    symbolFontSize: 84,
    cornerRadius: 18,
    reelBackground: 0x111827,
    reelBorder: 0xf59e0b,
    reelBorderWidth: 3,
  },
} as const satisfies GameConfig;
