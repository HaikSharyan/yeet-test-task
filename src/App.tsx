import { useRef, useState } from "react";
import { GameControls } from "./components/GameControls";
import { GameHeader } from "./components/GameHeader";
import { GameStage } from "./components/GameStage";
import { GameStats } from "./components/GameStats";
import { symbols, symbolsById } from "./config/symbols";
import { generateResult } from "./domain/resultGenerator";
import type { SpinResult } from "./domain/types";
import { calculateWin } from "./domain/winCalculator";

const reelCount = 3;
const betOptions = [1, 2, 5, 10] as const;
const initialBalance = 100;
const spinDuration = 500;

export default function App() {
  const [result, setResult] = useState<SpinResult>(() =>
    generateResult(reelCount, symbols),
  );
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState<number>(betOptions[0]);
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

    const nextResult = generateResult(reelCount, symbols);

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
    }, spinDuration);
  };

  const displayedMessage =
    !spinning && !affordable ? "Not enough credits" : message;

  return (
    <main className="app-shell">
      <GameHeader />

      <section className="game-card">
        <GameStage result={result} symbolsById={symbolsById} />

        <GameStats
          balance={balance}
          bet={bet}
          lastWin={lastWin}
          lastResult={lastResult}
          symbolsById={symbolsById}
        />

        <GameControls
          bet={bet}
          betOptions={betOptions}
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
