export interface SymbolConfig {
    name: string;
    glyph: string;
}

export const symbols = [
    {
        name: 'cherry',
        glyph: '🍒',
    },
    {
        name: 'lemon',
        glyph: '🍋',
    },
    {
        name: 'bell',
        glyph: '🔔',
    },
    {
        name: 'star',
        glyph: '⭐',
    },
    {
        name: 'diamond',
        glyph: '💎',
    },
] as const satisfies readonly SymbolConfig[];

export type GameSymbol = (typeof symbols)[number];