import { Container, Graphics, Text } from "pixi.js";
import type { GameConfig } from "../config/types";
import { PixiRuntime } from "../core/PixiRuntime";
import type { SpinResult, SymbolIndex } from "../domain/types";

export class PixiGame {
  private readonly runtime = new PixiRuntime();
  private readonly symbolTexts: Text[] = [];

  private result: SpinResult | null = null;
  private destroyed = false;

  constructor(
    private readonly config: GameConfig,
    private readonly symbolsById: SymbolIndex,
  ) {}

  async init(host: HTMLDivElement): Promise<void> {
    const { reels, reel, theme } = this.config;
    const stageWidth = reels * reel.width + (reels - 1) * reel.gap;
    const stageHeight = reel.symbolHeight;

    const mounted = await this.runtime.mount(host, {
      width: stageWidth,
      height: stageHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    if (!mounted || this.destroyed) {
      return;
    }

    const reelsLayer = new Container();
    this.runtime.app.stage.addChild(reelsLayer);

    for (let index = 0; index < reels; index++) {
      const reelContainer = new Container();

      reelContainer.x = index * (reel.width + reel.gap);

      const background = new Graphics()
        .roundRect(0, 0, reel.width, reel.symbolHeight, theme.cornerRadius)
        .fill(theme.reelBackground)
        .stroke({
          width: theme.reelBorderWidth,
          color: theme.reelBorder,
        });

      const symbolText = new Text({
        text: "?",
        style: {
          fontSize: theme.symbolFontSize,
          align: "center",
        },
      });

      symbolText.anchor.set(0.5);
      symbolText.position.set(reel.width / 2, reel.symbolHeight / 2);

      reelContainer.addChild(background, symbolText);
      reelsLayer.addChild(reelContainer);
      this.symbolTexts.push(symbolText);
    }

    this.renderResult();
  }

  setResult(result: SpinResult): void {
    this.result = result;
    this.renderResult();
  }

  destroy(): void {
    this.destroyed = true;
    this.symbolTexts.length = 0;
    this.runtime.destroy();
  }

  private renderResult(): void {
    if (!this.result) {
      return;
    }

    for (let index = 0; index < this.symbolTexts.length; index++) {
      const symbolId = this.result.reels[index];
      const symbol = this.symbolsById.get(symbolId);

      this.symbolTexts[index].text = symbol?.glyph ?? "?";
    }
  }
}
