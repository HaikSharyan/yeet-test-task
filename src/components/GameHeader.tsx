import type { ReactNode } from "react";

interface GameHeaderProps {
  children?: ReactNode;
}

export function GameHeader({ children }: GameHeaderProps) {
  return (
    <header className="game-header">
      <span className="eyebrow">Three-reel slot</span>
      <h1>Test Game</h1>
      <p>Match the symbols and test your luck.</p>
      {children}
    </header>
  );
}
