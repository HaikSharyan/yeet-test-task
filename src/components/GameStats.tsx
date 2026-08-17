import type { GameSymbol } from '../config/symbols';
import { ResultDisplay } from './ResultDisplay';
import { StatItem } from './StatItem';

interface GameStatsProps {
    balance: number;
    bet: number;
    lastWin: number;
    lastResult: readonly GameSymbol[];
}

export function GameStats({
                              balance,
                              bet,
                              lastWin,
                              lastResult,
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
                <ResultDisplay symbols={lastResult} />
            </StatItem>
        </div>
    );
}