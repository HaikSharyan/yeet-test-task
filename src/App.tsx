import { useCallback, useRef, useState } from "react";
import { symbolsById } from "./config/symbols";
import { gameConfig } from "./config/gameConfig";
import { GameStats } from "./components/GameStats";
import { GameHeader } from "./components/GameHeader";
import { GameCanvas } from "./components/GameCanvas";
import { GameControls } from "./components/GameControls";
import { calculateWin } from "./domain/winCalculator";
import { shouldAnticipate } from "./domain/anticipation";
import { generateResult } from "./domain/resultGenerator";
import type { SpinRequest, SpinResult } from "./domain/types";

export default function App() {
  const [result, setResult] = useState<SpinResult>(() =>
    generateResult(gameConfig.reels, gameConfig.rows, gameConfig.symbols),
  );
  const [lastWin, setLastWin] = useState(0);
  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Loading game");
  const [bet, setBet] = useState<number>(gameConfig.betOptions[0]);
  const [balance, setBalance] = useState<number>(gameConfig.initialBalance);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [spinRequest, setSpinRequest] = useState<SpinRequest | null>(null);

  const spinningRef = useRef(false);
  const spinRequestRef = useRef<SpinRequest | null>(null);

  const affordable = balance >= bet;

  const spin = () => {
    if (!ready || spinningRef.current || balance < bet) {
      return;
    }

    const nextResult = generateResult(
      gameConfig.reels,
      gameConfig.rows,
      gameConfig.symbols,
    );
    const request: SpinRequest = {
      result: nextResult,
      bet,
      anticipate: shouldAnticipate(nextResult, symbolsById),
    };

    spinningRef.current = true;
    spinRequestRef.current = request;

    setSpinning(true);
    setBalance((currentBalance) => currentBalance - bet);
    setMessage("Good luck!");
    setSpinRequest(request);
  };

  const completeSpin = useCallback(() => {
    const request = spinRequestRef.current;

    if (!request) {
      return;
    }

    spinRequestRef.current = null;

    const win = calculateWin(request.result, request.bet, symbolsById);

    setResult(request.result);
    setLastResult(request.result);
    setLastWin(win);
    setBalance((currentBalance) => currentBalance + win);

    spinningRef.current = false;
    setSpinning(false);
    setSpinRequest(null);

    if (win > 0) {
      setMessage(`You won ${win} credits!`);
    } else {
      setMessage("No win - try again");
    }
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
    setMessage("Place your bet");
  }, []);

  const displayedMessage =
    ready && !spinning && !affordable ? "Not enough credits" : message;

  return (
    <main className="app-shell">
      <GameHeader />

      <section className="game-card">
        <GameCanvas
          result={result}
          onReady={handleReady}
          spinRequest={spinRequest}
          onSpinComplete={completeSpin}
        />

        <GameStats
          bet={bet}
          balance={balance}
          lastWin={lastWin}
          lastResult={lastResult}
          symbolsById={symbolsById}
        />

        <GameControls
          bet={bet}
          onSpin={spin}
          spinning={spinning}
          onBetChange={setBet}
          affordable={affordable}
          message={displayedMessage}
          disabled={!ready || spinning}
          betOptions={gameConfig.betOptions}
        />
      </section>
    </main>
  );
}
