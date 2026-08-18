import { useRef, useState } from "react";
import { symbolsById } from "./config/symbols";
import { gameConfig } from "./config/gameConfig";
import type { SpinResult } from "./domain/types";
import { GameStats } from "./components/GameStats";
import { GameHeader } from "./components/GameHeader";
import { GameCanvas } from "./components/GameCanvas";
import { calculateWin } from "./domain/winCalculator";
import { GameControls } from "./components/GameControls";
import { generateResult } from "./domain/resultGenerator";

export default function App() {
  const [result, setResult] = useState<SpinResult>(() =>
    generateResult(gameConfig.reels, gameConfig.symbols),
  );
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [balance, setBalance] = useState<number>(gameConfig.initialBalance);
  const [bet, setBet] = useState<number>(gameConfig.betOptions[0]);
  const [lastWin, setLastWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Place your bet");

  const spinningRef = useRef(false);
  const affordable = balance >= bet;

  const spin = () => {
    if (spinningRef.current || balance < bet) {
      return;
    }

    spinningRef.current = true;
    setSpinning(true);
    setBalance((currentBalance) => currentBalance - bet);
    setMessage("Good luck!");

    const nextResult = generateResult(gameConfig.reels, gameConfig.symbols);

    window.setTimeout(() => {
      const win = calculateWin(nextResult, bet, symbolsById);

      setResult(nextResult);
      setLastResult(nextResult);
      setLastWin(win);
      setBalance((currentBalance) => currentBalance + win);

      spinningRef.current = false;
      setSpinning(false);

      if (win > 0) {
        setMessage(`You won ${win} credits!`);
      } else {
        setMessage("No win - try again");
      }
    }, gameConfig.spinDuration);
  };

  const displayedMessage =
    !spinning && !affordable ? "Not enough credits" : message;

  return (
    <main className="app-shell">
      <GameHeader />

      <section className="game-card">
        <GameCanvas result={result} />

        <GameStats
          balance={balance}
          bet={bet}
          lastWin={lastWin}
          lastResult={lastResult}
          symbolsById={symbolsById}
        />

        <GameControls
          bet={bet}
          betOptions={gameConfig.betOptions}
          spinning={spinning}
          affordable={affordable}
          message={displayedMessage}
          onBetChange={setBet}
          onSpin={spin}
        />
      </section>
    </main>
  );
}
