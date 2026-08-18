import type { SymbolDefinition } from "../domain/types";

export interface ReelConfig {
  width: number;
  symbolHeight: number;
  gap: number;
}

export interface ThemeConfig {
  symbolFontSize: number;
  cornerRadius: number;
  reelBackground: number;
  reelBorder: number;
  reelBorderWidth: number;
}

export interface GameConfig {
  reels: number;
  symbols: readonly SymbolDefinition[];
  betOptions: readonly number[];
  initialBalance: number;
  spinDuration: number;
  reel: ReelConfig;
  theme: ThemeConfig;
}
