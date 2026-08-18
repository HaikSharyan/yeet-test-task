import type { SymbolDefinition, SymbolIndex } from "../domain/types";

export const symbols = [
  {
    id: 1,
    label: "cherry",
    glyph: "🍒",
    weight: 34,
    payouts: {
      2: 1,
      3: 5,
    },
  },
  {
    id: 2,
    label: "lemon",
    glyph: "🍋",
    weight: 27,
    payouts: {
      2: 1,
      3: 10,
    },
  },
  {
    id: 3,
    label: "bell",
    glyph: "🔔",
    weight: 19,
    payouts: {
      2: 2,
      3: 20,
    },
  },
  {
    id: 4,
    label: "star",
    glyph: "⭐",
    weight: 13,
    payouts: {
      2: 3,
      3: 50,
    },
  },
  {
    id: 5,
    label: "diamond",
    glyph: "💎",
    weight: 7,
    payouts: {
      2: 5,
      3: 150,
    },
  },
] as const satisfies readonly SymbolDefinition[];

export const symbolsById: SymbolIndex = new Map(
  symbols.map((symbol) => [symbol.id, symbol]),
);
