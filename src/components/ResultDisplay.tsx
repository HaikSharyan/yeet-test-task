import type { SpinResult, SymbolIndex } from "../domain/types";

interface ResultDisplayProps {
  result: SpinResult | null;
  symbolsById: SymbolIndex;
}

export function ResultDisplay({ result, symbolsById }: ResultDisplayProps) {
  if (!result) {
    return <strong>-</strong>;
  }

  const resultLabel = result.reels
    .map((reel) => {
      return reel.symbols
        .map((symbolId) => {
          return symbolsById.get(symbolId)?.label ?? "unknown";
        })
        .join(", ");
    })
    .join(" / ");

  return (
    <strong className="result-display" aria-label={resultLabel}>
      {result.reels.map((reel, reelIndex) => (
        <span className="result-reel" key={reelIndex}>
          {reel.symbols.map((symbolId, rowIndex) => (
            <span key={`${symbolId}-${rowIndex}`} aria-hidden="true">
              {symbolsById.get(symbolId)?.glyph ?? "?"}
            </span>
          ))}
        </span>
      ))}
    </strong>
  );
}
