export function GameLoader() {
  return (
    <div className="game-loader" role="status" aria-live="polite">
      <span className="game-loader__spinner" />
      <span>Loading game</span>
    </div>
  );
}
