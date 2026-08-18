import { useEffect, useRef, useState } from "react";

import { GameLoader } from "./GameLoader";
import { PixiGame } from "../game/PixiGame";
import type { SpinResult } from "../domain/types";
import { symbolsById } from "../config/symbols";
import { gameConfig } from "../config/gameConfig";

interface GameCanvasProps {
  result: SpinResult;
}

type CanvasStatus = "loading" | "ready" | "error";

export function GameCanvas({ result }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PixiGame | null>(null);
  const initialResultRef = useRef(result);
  const [status, setStatus] = useState<CanvasStatus>("loading");

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    console.log(symbolsById);
    const game = new PixiGame(gameConfig, symbolsById);

    gameRef.current = game;
    game.setResult(initialResultRef.current);

    let active = true;

    void game
      .init(host)
      .then(() => {
        if (!active) {
          return;
        }

        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error("Could not start the renderer", error);

        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
      gameRef.current = null;
      game.destroy();
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setResult(result);
  }, [result]);

  const resultLabel = result.reels
    .map((symbolId) => {
      return symbolsById.get(symbolId)?.label ?? "unknown";
    })
    .join(", ");

  const stageWidth =
    gameConfig.reels * gameConfig.reel.width +
    (gameConfig.reels - 1) * gameConfig.reel.gap;
  const stageHeight = gameConfig.reel.symbolHeight;

  return (
    <div
      className="game-stage"
      style={{
        aspectRatio: `${stageWidth} / ${stageHeight}`,
      }}
      aria-label={`Slot result: ${resultLabel}`}
    >
      <div className="game-canvas" ref={hostRef} aria-hidden="true" />

      {status === "loading" && <GameLoader />}

      {status === "error" && (
        <div className="game-loader game-loader--error" role="alert">
          <span>Could not start the renderer</span>
          <span className="game-loader__hint">
            This browser could not create a WebGL or WebGPU context
          </span>
        </div>
      )}
    </div>
  );
}
