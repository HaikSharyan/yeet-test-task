import { Container } from "pixi.js";
import { Reel } from "./Reel";
import type { GameConfig } from "../config/types";
import { PixiRuntime } from "../core/PixiRuntime";
import { findRowWins } from "../domain/winCalculator";
import type { SpinResult, SymbolIndex } from "../domain/types";

type PerformanceHandler = (fps: number, maxFrameTime: number) => void;

export class PixiGame {
  private readonly runtime = new PixiRuntime();
  private readonly reels: Reel[] = [];

  private result: SpinResult | null = null;
  private destroyed = false;
  private spinning = false;
  private finishWait: (() => void) | null = null;
  private performanceFrames = 0;
  private performanceElapsed = 0;
  private maxFrameTime = 0;

  constructor(
    private readonly config: GameConfig,
    private readonly symbolsById: SymbolIndex,
    private readonly onPerformance: PerformanceHandler = () => {},
  ) {}

  async init(host: HTMLDivElement): Promise<void> {
    const { reels, rows, reel } = this.config;
    const stageWidth = reels * reel.width + (reels - 1) * reel.gap;
    const stageHeight = rows * reel.symbolHeight;

    const mounted = await this.runtime.mount(
      host,
      {
        width: stageWidth,
        height: stageHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      },
      (ticker) => {
        for (const reelView of this.reels) {
          reelView.update(ticker);
        }

        if (!this.config.performance.enabled) {
          return;
        }

        this.performanceFrames++;
        this.performanceElapsed += ticker.elapsedMS;
        this.maxFrameTime = Math.max(this.maxFrameTime, ticker.elapsedMS);

        if (this.performanceElapsed >= this.config.performance.sampleInterval) {
          const fps = (this.performanceFrames * 1000) / this.performanceElapsed;

          this.onPerformance(fps, this.maxFrameTime);
          this.performanceFrames = 0;
          this.performanceElapsed = 0;
          this.maxFrameTime = 0;
        }
      },
    );

    if (!mounted || this.destroyed) {
      return;
    }

    const reelsLayer = new Container();
    this.runtime.app.stage.addChild(reelsLayer);

    for (let index = 0; index < reels; index++) {
      const reelView = new Reel({
        symbols: this.config.symbols,
        symbolsById: this.symbolsById,
        rows,
        reel: this.config.reel,
        theme: this.config.theme,
      });

      reelView.view.x = index * (reel.width + reel.gap);

      reelsLayer.addChild(reelView.view);
      this.reels.push(reelView);
    }

    if (this.result) {
      this.setResult(this.result);
    }
  }

  setResult(result: SpinResult): void {
    this.result = result;

    if (this.spinning) {
      return;
    }

    for (let index = 0; index < this.reels.length; index++) {
      const reelResult = result.reels[index];

      if (reelResult) {
        this.reels[index].show(reelResult.symbols);
      }
    }
  }

  async spin(result: SpinResult, anticipate: boolean): Promise<void> {
    if (this.spinning || this.destroyed) {
      return;
    }

    this.spinning = true;
    this.result = result;

    const lastReel = this.reels.length - 1;
    const stops: Promise<void>[] = [];

    try {
      for (const reel of this.reels) {
        reel.start();
      }

      await this.wait(this.config.reel.spinDuration);

      if (this.destroyed) {
        return;
      }

      for (let index = 0; index < this.reels.length; index++) {
        if (index > 0) {
          await this.wait(this.config.reel.stopDelay);

          if (this.destroyed) {
            return;
          }
        }

        if (anticipate && index === lastReel) {
          await Promise.all(stops);

          if (this.destroyed) {
            return;
          }

          const reel = this.reels[index];

          reel.setAnticipating(true);

          await this.wait(this.config.reel.anticipationDelay);

          if (this.destroyed) {
            return;
          }

          reel.setAnticipating(false);
        }

        const reelResult = result.reels[index];

        if (reelResult) {
          stops.push(this.reels[index].stop(reelResult.symbols));
        }
      }

      await Promise.all(stops);

      if (this.destroyed) {
        return;
      }

      const wins = findRowWins(result, this.symbolsById);

      if (wins.length > 0) {
        await Promise.all(
          this.reels.map((reel, reelIndex) => {
            const winningRows: number[] = [];

            for (const win of wins) {
              if (reelIndex < win.runLength) {
                winningRows.push(win.row);
              }
            }

            return reel.playWin(
              winningRows,
              this.config.reel.winAnimationDuration,
            );
          }),
        );
      }
    } finally {
      this.finishWait = null;
      this.spinning = false;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.finishWait?.();

    for (const reel of this.reels) {
      reel.destroy();
    }

    this.reels.length = 0;
    this.runtime.destroy();
  }

  private wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const timeoutId = globalThis.setTimeout(() => {
        this.finishWait = null;
        resolve();
      }, duration);

      this.finishWait = () => {
        globalThis.clearTimeout(timeoutId);
        this.finishWait = null;
        resolve();
      };
    });
  }
}
