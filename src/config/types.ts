import type { SymbolDefinition } from "../domain/types";

export interface ReelConfig {
  gap: number;
  speed: number;
  width: number;
  stopDelay: number;
  spinDuration: number;
  symbolHeight: number;
  minStopDuration: number;
  maxStopDuration: number;
  anticipationDelay: number;
  accelerationDuration: number;
  winAnimationDuration: number;
  anticipationPulseDuration: number;
}

export interface WinPulseConfig {
  cycles: number;
  scale: number;
  minAlpha: number;
}

export interface ThemeConfig {
  reelBorder: number;
  cornerRadius: number;
  symbolFontSize: number;
  reelBackground: number;
  reelBorderWidth: number;
  anticipationColor: number;
  anticipationMinAlpha: number;
  anticipationMaxAlpha: number;
  anticipationBorderWidth: number;
  winPulse: WinPulseConfig;
}

export interface GameConfig {
  rows: number;
  reels: number;
  initialBalance: number;
  betOptions: readonly number[];
  symbols: readonly SymbolDefinition[];
  reel: ReelConfig;
  theme: ThemeConfig;
}
