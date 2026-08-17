import type { GameSymbol } from '../config/symbols';

interface GameStageProps {
    reels: readonly GameSymbol[];
}

export function GameStage({ reels }: GameStageProps) {
    const resultLabel = reels.map((symbol) => symbol.name).join(', ');

    return (
        <div className="game-stage" aria-label={`Slot result: ${resultLabel}`}>
            <div className="reels">
                {reels.map((symbol, index) => (
                    <div className="reel" key={index}>
                        <span aria-hidden="true">{symbol.glyph}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}