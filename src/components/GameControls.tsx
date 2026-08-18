interface GameControlsProps {
  bet: number;
  betOptions: readonly number[];
  disabled: boolean;
  spinning: boolean;
  affordable: boolean;
  message: string;
  onBetChange: (bet: number) => void;
  onSpin: () => void;
}

export function GameControls({
  bet,
  betOptions,
  disabled,
  spinning,
  affordable,
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
          disabled={disabled}
          onChange={(event) => {
            onBetChange(Number(event.target.value));
          }}
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
        disabled={disabled || !affordable}
        onClick={onSpin}
      >
        {spinning ? "Spinning…" : "Spin"}
      </button>

      <p className="message" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
