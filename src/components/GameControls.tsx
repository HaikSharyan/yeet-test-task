interface GameControlsProps {
    bet: number;
    betOptions: readonly number[];
    spinning: boolean;
    message: string;
    onBetChange: (bet: number) => void;
    onSpin: () => void;
}

export function GameControls({
                                 bet,
                                 betOptions,
                                 spinning,
                                 message,
                                 onBetChange,
                                 onSpin,
                             }: GameControlsProps) {
    return (
        <div className="controls">
            <label className="bet-control">
                <span>Bet</span>

                <select
                    value={bet}
                    disabled={spinning}
                    onChange={(event) => onBetChange(Number(event.target.value))}
                >
                    {betOptions.map((option) => (
                        <option value={option} key={option}>
                            {option} credits
                        </option>
                    ))}
                </select>
            </label>

            <button
                className="spin-button"
                type="button"
                disabled={spinning}
                onClick={onSpin}
            >
                {spinning ? 'Spinning…' : 'Spin'}
            </button>

            <p className="message" aria-live="polite">
                {message}
            </p>
        </div>
    );
}