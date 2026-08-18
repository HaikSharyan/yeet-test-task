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
    .map((symbolId) => {
      return symbolsById.get(symbolId)?.label ?? "unknown";
    })
    .join(", ");

  return (
    <strong className="result-display" aria-label={resultLabel}>
      {result.reels.map((symbolId, index) => (
        <span key={`${symbolId}-${index}`} aria-hidden="true">
          {symbolsById.get(symbolId)?.glyph ?? "?"}
        </span>
      ))}
    </strong>
  );
}
