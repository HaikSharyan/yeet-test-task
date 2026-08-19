import { symbols } from "./symbols";
import type { GameConfig } from "./types";

export const gameConfig = {
  reels: 3,
  rows: 1,
  symbols,
  betOptions: [1, 2, 5, 10],
  initialBalance: 100,
  reel: {
    gap: 16,
    width: 150,
    speed: 1350,
    stopDelay: 300,
    symbolHeight: 170,
    spinDuration: 700,
    minStopDuration: 450,
    maxStopDuration: 900,
    anticipationDelay: 1000,
    accelerationDuration: 250,
    winAnimationDuration: 700,
    anticipationPulseDuration: 600,
  },
  theme: {
    cornerRadius: 18,
    symbolFontSize: 84,
    reelBorderWidth: 3,
    reelBorder: 0xf59e0b,
    reelBackground: 0x111827,
    anticipationMaxAlpha: 0.9,
    anticipationBorderWidth: 6,
    anticipationMinAlpha: 0.35,
    anticipationColor: 0xfbbf24,
    winPulse: {
      cycles: 3,
      scale: 0.14,
      minAlpha: 0.8,
    },
  },
} as const satisfies GameConfig;
