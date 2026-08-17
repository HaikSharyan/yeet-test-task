import type { GameSymbol } from '../config/symbols';

interface ResultDisplayProps {
    symbols: readonly GameSymbol[];
}

export function ResultDisplay({ symbols }: ResultDisplayProps) {
    return (
        <strong
            className="result-display"
            aria-label={symbols.map((symbol) => symbol.name).join(', ')}
        >
            {symbols.map((symbol, index) => (
                <span key={`${symbol.name}-${index}`} aria-hidden="true">
          {symbol.glyph}
        </span>
            ))}
        </strong>
    );
}