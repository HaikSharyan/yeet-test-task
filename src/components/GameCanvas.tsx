import { useEffect, useRef, useState } from "react";
import { GameLoader } from "./GameLoader";
import { PixiGame } from "../game/PixiGame";
import { gameConfig } from "../config/gameConfig";
import { symbolsById } from "../config/symbols";
import type { SpinRequest, SpinResult } from "../domain/types";

interface GameCanvasProps {
  result: SpinResult;
  onReady: () => void;
  onSpinComplete: () => void;
  spinRequest: SpinRequest | null;
}

type CanvasStatus = "loading" | "ready" | "error";

export function GameCanvas({
  result,
  onReady,
  spinRequest,
  onSpinComplete,
}: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PixiGame | null>(null);
  const initialResultRef = useRef(result);
  const callbacksRef = useRef({
    onReady,
    onSpinComplete,
  });
  const [status, setStatus] = useState<CanvasStatus>("loading");

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onSpinComplete,
    };
  }, [onReady, onSpinComplete]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

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
        callbacksRef.current.onReady();
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
    if (!spinRequest || !gameRef.current) {
      return;
    }

    let active = true;

    void gameRef.current
      .spin(spinRequest.result)
      .catch((error: unknown) => {
        console.error("Spin presentation failed", error);
      })
      .finally(() => {
        if (active) {
          callbacksRef.current.onSpinComplete();
        }
      });

    return () => {
      active = false;
    };
  }, [spinRequest]);

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
