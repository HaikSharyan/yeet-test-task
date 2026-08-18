import type { SpinResult, SymbolIndex } from "../domain/types";
import { ResultDisplay } from "./ResultDisplay";
import { StatItem } from "./StatItem";

interface GameStatsProps {
  balance: number;
  bet: number;
  lastWin: number;
  lastResult: SpinResult | null;
  symbolsById: SymbolIndex;
}

export function GameStats({
  balance,
  bet,
  lastWin,
  lastResult,
  symbolsById,
}: GameStatsProps) {
  return (
    <div className="stats">
      <StatItem label="Balance">
        <strong>{balance}</strong>
      </StatItem>

      <StatItem label="Current bet">
        <strong>{bet}</strong>
      </StatItem>

      <StatItem label="Last win">
        <strong>{lastWin}</strong>
      </StatItem>

      <StatItem label="Last result">
        <ResultDisplay result={lastResult} symbolsById={symbolsById} />
      </StatItem>
    </div>
  );
}
