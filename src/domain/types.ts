export type SymbolId = number;

export interface SymbolDefinition {
  id: SymbolId;
  label: string;
  glyph: string;
  weight: number;
  payouts: Readonly<Record<number, number>>;
  highValue?: boolean;
}

export type SymbolIndex = ReadonlyMap<SymbolId, SymbolDefinition>;

export interface ReelResult {
  symbols: SymbolId[];
}

export interface SpinResult {
  reels: ReelResult[];
}

export interface SpinRequest {
  result: SpinResult;
  bet: number;
  anticipate: boolean;
}
