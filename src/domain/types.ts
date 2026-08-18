export type SymbolId = number;

export interface SymbolDefinition {
  id: SymbolId;
  label: string;
  glyph: string;
  weight: number;
  payouts: Readonly<Record<number, number>>;
}

export type SymbolIndex = ReadonlyMap<SymbolId, SymbolDefinition>;

export interface SpinResult {
  reels: SymbolId[];
}

export interface SpinRequest {
  result: SpinResult;
  bet: number;
}
