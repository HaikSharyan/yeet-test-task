import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import { pickWeighted } from "../core/random";
import type { ReelConfig, ThemeConfig } from "../config/types";
import { easeOutCubic, easeOutQuad, modulo } from "../core/math";
import type { SymbolDefinition, SymbolId, SymbolIndex } from "../domain/types";

interface SymbolView {
  container: Container;
  text: Text;
}

interface LandingState {
  distance: number;
  duration: number;
  elapsed: number;
  travelled: number;
  resolve: () => void;
}

interface ReelOptions {
  symbols: readonly SymbolDefinition[];
  symbolsById: SymbolIndex;
  reel: ReelConfig;
  theme: ThemeConfig;
}

export class Reel {
  readonly view = new Container();

  private readonly symbols: readonly SymbolDefinition[];
  private readonly symbolsById: SymbolIndex;
  private readonly config: ReelConfig;
  private readonly symbolViews: SymbolView[] = [];
  private readonly landingTargets = new Map<SymbolView, SymbolId>();

  private readonly stripHeight: number;
  private readonly windowHeight: number;

  private spinElapsed = 0;
  private currentSpeed = 0;
  private spinning = false;
  private landing: LandingState | null = null;

  constructor(options: ReelOptions) {
    this.symbols = options.symbols;
    this.symbolsById = options.symbolsById;
    this.config = options.reel;

    const { reel, theme } = options;

    this.windowHeight = reel.symbolHeight;
    this.stripHeight = reel.symbolHeight * 3;

    const mask = new Graphics()
      .roundRect(0, 0, reel.width, this.windowHeight, theme.cornerRadius)
      .fill(0xffffff);

    const background = new Graphics()
      .roundRect(0, 0, reel.width, this.windowHeight, theme.cornerRadius)
      .fill(theme.reelBackground)
      .stroke({
        width: theme.reelBorderWidth,
        color: theme.reelBorder,
      });

    const symbolLayer = new Container();
    symbolLayer.mask = mask;

    this.view.addChild(background, mask, symbolLayer);

    // One visible symbol plus one pooled view
    // above and below the reel window.
    for (let index = 0; index < 3; index++) {
      const container = new Container();

      container.y = (index - 1) * reel.symbolHeight;

      const initialSymbol = this.symbols[index % this.symbols.length];

      const text = new Text({
        text: initialSymbol.glyph,
        style: {
          fontSize: theme.symbolFontSize,
          align: "center",
        },
      });

      text.anchor.set(0.5);
      text.position.set(reel.width / 2, reel.symbolHeight / 2);

      container.addChild(text);
      symbolLayer.addChild(container);

      this.symbolViews.push({
        container,
        text,
      });
    }
  }

  show(symbolId: SymbolId): void {
    const visibleView = this.symbolViews.find(
      ({ container }) => container.y >= 0 && container.y < this.windowHeight,
    );

    if (visibleView) {
      this.setSymbol(visibleView, symbolId);
    }
  }

  start(): void {
    this.spinElapsed = 0;
    this.currentSpeed = 0;
    this.landing = null;
    this.landingTargets.clear();
    this.spinning = true;
  }

  update(ticker: Ticker): void {
    if (!this.spinning) {
      return;
    }

    if (this.landing) {
      this.updateLanding(ticker.deltaMS);
      return;
    }

    this.spinElapsed += ticker.deltaMS;

    const progress = Math.min(
      this.spinElapsed / this.config.accelerationDuration,
      1,
    );

    this.currentSpeed = this.config.speed * easeOutCubic(progress);

    this.move((this.currentSpeed * ticker.deltaMS) / 1000);
  }

  stop(symbolId: SymbolId): Promise<void> {
    if (!this.spinning || this.landing) {
      return Promise.resolve();
    }

    const { symbolHeight } = this.config;
    const phase = modulo(this.symbolViews[0].container.y, symbolHeight);
    const alignment = phase < 0.001 ? 0 : symbolHeight - phase;
    const distance = this.stripHeight + alignment;

    const naturalDuration =
      (2 * distance * 1000) / Math.max(this.currentSpeed, 1);
    const duration = Math.min(
      this.config.maxStopDuration,
      Math.max(this.config.minStopDuration, naturalDuration),
    );

    this.planLandingTarget(symbolId, distance);

    for (const [view, target] of this.landingTargets) {
      const y = view.container.y;
      const outsideWindow = y + symbolHeight <= 0 || y >= this.windowHeight;

      if (outsideWindow) {
        this.setSymbol(view, target);
      }
    }

    return new Promise((resolve) => {
      this.landing = {
        distance,
        duration,
        elapsed: 0,
        travelled: 0,
        resolve,
      };
    });
  }

  destroy(): void {
    this.spinning = false;
    this.currentSpeed = 0;

    this.landing?.resolve();
    this.landing = null;
    this.landingTargets.clear();
  }

  private updateLanding(deltaMS: number): void {
    const landing = this.landing;

    if (!landing) {
      return;
    }

    landing.elapsed = Math.min(landing.elapsed + deltaMS, landing.duration);

    const progress = landing.elapsed / landing.duration;
    const travelled = landing.distance * easeOutQuad(progress);

    this.move(travelled - landing.travelled);

    landing.travelled = travelled;

    if (progress < 1) {
      return;
    }

    for (const [view, symbolId] of this.landingTargets) {
      this.setSymbol(view, symbolId);
    }

    this.spinning = false;
    this.currentSpeed = 0;
    this.landing = null;

    landing.resolve();
  }

  private move(distance: number): void {
    const wrapAt = this.windowHeight + this.config.symbolHeight;

    for (const view of this.symbolViews) {
      view.container.y += distance;

      if (view.container.y < wrapAt) {
        continue;
      }

      view.container.y -= this.stripHeight;

      const target = this.landingTargets.get(view);

      if (target !== undefined) {
        this.setSymbol(view, target);
      } else {
        view.text.text = pickWeighted(this.symbols).glyph;
      }
    }
  }

  private planLandingTarget(symbolId: SymbolId, distance: number): void {
    const wrapAt = this.windowHeight + this.config.symbolHeight;

    this.landingTargets.clear();

    for (const view of this.symbolViews) {
      let finalY = view.container.y + distance;

      while (finalY >= wrapAt) {
        finalY -= this.stripHeight;
      }

      const landsInWindow = Math.round(finalY / this.config.symbolHeight) === 0;

      if (landsInWindow) {
        this.landingTargets.set(view, symbolId);
      }
    }
  }

  private setSymbol(view: SymbolView, symbolId: SymbolId): void {
    const symbol = this.symbolsById.get(symbolId);

    view.text.text = symbol?.glyph ?? "?";
  }
}
