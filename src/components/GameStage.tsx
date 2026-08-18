import type { SpinResult, SymbolIndex } from "../domain/types";

interface GameStageProps {
  result: SpinResult;
  symbolsById: SymbolIndex;
}

export function GameStage({ result, symbolsById }: GameStageProps) {
  const resultLabel = result.reels
    .map((symbolId) => {
      return symbolsById.get(symbolId)?.label ?? "unknown";
    })
    .join(", ");

  return (
    <div className="game-stage" aria-label={`Slot result: ${resultLabel}`}>
      <div className="reels">
        {result.reels.map((symbolId, index) => {
          const symbol = symbolsById.get(symbolId);

          return (
            <div className="reel" key={index}>
              <span aria-hidden="true">{symbol?.glyph ?? "?"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
