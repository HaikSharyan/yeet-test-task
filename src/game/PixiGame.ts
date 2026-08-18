import { Container } from "pixi.js";
import type { GameConfig } from "../config/types";
import { PixiRuntime } from "../core/PixiRuntime";
import type { SpinResult, SymbolIndex } from "../domain/types";
import { Reel } from "./Reel";

export class PixiGame {
  private readonly runtime = new PixiRuntime();
  private readonly reels: Reel[] = [];

  private result: SpinResult | null = null;
  private destroyed = false;
  private spinning = false;
  private finishWait: (() => void) | null = null;

  constructor(
    private readonly config: GameConfig,
    private readonly symbolsById: SymbolIndex,
  ) {}

  async init(host: HTMLDivElement): Promise<void> {
    const { reels, reel } = this.config;
    const stageWidth = reels * reel.width + (reels - 1) * reel.gap;
    const stageHeight = reel.symbolHeight;

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
        for (const reel of this.reels) {
          reel.update(ticker);
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
        reel: this.config.reel,
        theme: this.config.theme,
      });

      reelView.view.x = index * (this.config.reel.width + this.config.reel.gap);

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
      const symbolId = result.reels[index];

      if (symbolId !== undefined) {
        this.reels[index].show(symbolId);
      }
    }
  }

  async spin(result: SpinResult): Promise<void> {
    if (this.spinning || this.destroyed) {
      return;
    }

    this.spinning = true;
    this.result = result;

    try {
      for (const reel of this.reels) {
        reel.start();
      }

      await this.wait(this.config.reel.spinDuration);

      if (this.destroyed) {
        return;
      }

      const stops: Promise<void>[] = [];

      for (let index = 0; index < this.reels.length; index++) {
        if (index > 0) {
          await this.wait(this.config.reel.stopDelay);

          if (this.destroyed) {
            return;
          }
        }

        const symbolId = result.reels[index];

        if (symbolId !== undefined) {
          stops.push(this.reels[index].stop(symbolId));
        }
      }

      await Promise.all(stops);
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
