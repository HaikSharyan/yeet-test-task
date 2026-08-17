import { useState } from 'react';
import { symbols } from './config/symbols';
import type { GameSymbol } from './config/symbols';
import { GameStage } from './components/GameStage';
import { GameStats } from './components/GameStats';
import { GameHeader } from './components/GameHeader';
import { GameControls } from './components/GameControls';

const betOptions = [1, 2, 5, 10] as const;
const initialBalance = 100;

function randomSymbol(): GameSymbol {
    const index = Math.floor(Math.random() * symbols.length);
    return symbols[index];
}

function generateReels(): GameSymbol[] {
    return [randomSymbol(), randomSymbol(), randomSymbol()];
}

export default function App() {
    const [reels, setReels] = useState<GameSymbol[]>(() => generateReels());
    const [bet, setBet] = useState<number>(betOptions[0]);
    const [spinning, setSpinning] = useState(false);
    const [message, setMessage] = useState('Place your bet');

    const spin = () => {
        if (spinning) return;

        setSpinning(true);
        setMessage('Good luck!');

        const duration = 500;

        window.setTimeout(() => {
            setReels(generateReels());
            setSpinning(false);
            setMessage('Spin complete');
        }, duration);
    };

    return (
        <main className="app-shell">
            <GameHeader />

            <section className="game-card">
                <GameStage reels={reels} />
                <GameStats
                    balance={initialBalance}
                    bet={bet}
                    lastWin={0}
                    lastResult={reels}
                />

                <GameControls
                    bet={bet}
                    betOptions={betOptions}
                    spinning={spinning}
                    message={message}
                    onBetChange={setBet}
                    onSpin={spin}
                />
            </section>
        </main>
    );
}