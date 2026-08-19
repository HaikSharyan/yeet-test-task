import { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import { pickWeighted } from "../core/random";
import type { ReelConfig, ThemeConfig } from "../config/types";
import { easeOutCubic, easeOutQuad, modulo, oscillate } from "../core/math";
import type { SymbolDefinition, SymbolId, SymbolIndex } from "../domain/types";

interface SymbolView {
  container: Container;
  text: Text;
  row: number;
}

interface LandingState {
  distance: number;
  duration: number;
  elapsed: number;
  travelled: number;
  resolve: () => void;
}

interface WinState {
  duration: number;
  elapsed: number;
  resolve: () => void;
}

interface ReelOptions {
  symbols: readonly SymbolDefinition[];
  symbolsById: SymbolIndex;
  rows: number;
  reel: ReelConfig;
  theme: ThemeConfig;
}

export class Reel {
  readonly view = new Container();

  private readonly symbols: readonly SymbolDefinition[];
  private readonly symbolsById: SymbolIndex;
  private readonly config: ReelConfig;
  private readonly theme: ThemeConfig;
  private readonly rows: number;
  private readonly symbolViews: SymbolView[] = [];
  private readonly landingTargets = new Map<SymbolView, SymbolId>();
  private readonly anticipationFrame = new Graphics();

  private readonly stripHeight: number;
  private readonly windowHeight: number;
  private readonly winViews: SymbolView[] = [];

  private winAnimation: WinState | null = null;
  private spinElapsed = 0;
  private currentSpeed = 0;
  private spinning = false;
  private anticipating = false;
  private anticipationElapsed = 0;
  private landing: LandingState | null = null;

  constructor(options: ReelOptions) {
    this.symbols = options.symbols;
    this.symbolsById = options.symbolsById;
    this.config = options.reel;
    this.theme = options.theme;
    this.rows = options.rows;

    const { reel, theme, rows } = options;

    this.windowHeight = rows * reel.symbolHeight;
    this.stripHeight = (rows + 2) * reel.symbolHeight;

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

    for (let index = 0; index < rows + 2; index++) {
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
        row: -1,
      });
    }

    const inset = theme.anticipationBorderWidth / 2;

    this.anticipationFrame
      .roundRect(
        inset,
        inset,
        reel.width - theme.anticipationBorderWidth,
        this.windowHeight - theme.anticipationBorderWidth,
        theme.cornerRadius - inset,
      )
      .stroke({
        width: theme.anticipationBorderWidth,
        color: theme.anticipationColor,
      });

    this.anticipationFrame.visible = false;
    this.view.addChild(this.anticipationFrame);
  }

  show(symbolIds: readonly SymbolId[]): void {
    for (const view of this.symbolViews) {
      const row = Math.round(view.container.y / this.config.symbolHeight);

      if (row >= 0 && row < this.rows && symbolIds[row] !== undefined) {
        view.row = row;
        this.setSymbol(view, symbolIds[row]);
      } else {
        view.row = -1;
      }
    }
  }

  start(): void {
    this.resetWinViews();
    this.winAnimation?.resolve();
    this.winAnimation = null;
    this.winViews.length = 0;

    this.spinElapsed = 0;
    this.currentSpeed = 0;
    this.landing = null;
    this.landingTargets.clear();

    for (const view of this.symbolViews) {
      view.row = -1;
    }

    this.setAnticipating(false);
    this.spinning = true;
  }

  update(ticker: Ticker): void {
    this.updateAnticipation(ticker.deltaMS);
    this.updateWin(ticker.deltaMS);

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
  stop(symbolIds: readonly SymbolId[]): Promise<void> {
    if (!this.spinning || this.landing) {
      return Promise.resolve();
    }

    const { symbolHeight } = this.config;
    const phase = modulo(this.symbolViews[0].container.y, symbolHeight);
    const alignment = phase < 0.001 ? 0 : symbolHeight - phase;
    const distance = Math.max(this.windowHeight, this.stripHeight) + alignment;

    const naturalDuration =
      (2 * distance * 1000) / Math.max(this.currentSpeed, 1);
    const duration = Math.min(
      this.config.maxStopDuration,
      Math.max(this.config.minStopDuration, naturalDuration),
    );

    this.planLandingTargets(symbolIds, distance);

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

  setAnticipating(active: boolean): void {
    this.anticipating = active;
    this.anticipationElapsed = 0;
    this.anticipationFrame.visible = active;
    this.anticipationFrame.alpha = active ? this.theme.anticipationMinAlpha : 0;
  }

  playWin(rows: readonly number[], duration: number): Promise<void> {
    this.resetWinViews();
    this.winViews.length = 0;

    for (const view of this.symbolViews) {
      if (view.row >= 0 && rows.includes(view.row)) {
        this.winViews.push(view);
      }
    }

    if (this.winViews.length === 0) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.winAnimation = {
        duration,
        elapsed: 0,
        resolve,
      };
    });
  }

  destroy(): void {
    this.setAnticipating(false);
    this.spinning = false;
    this.currentSpeed = 0;

    this.landing?.resolve();
    this.winAnimation?.resolve();

    this.landing = null;
    this.winAnimation = null;
    this.landingTargets.clear();

    this.resetWinViews();
    this.winViews.length = 0;
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

  private planLandingTargets(
    symbolIds: readonly SymbolId[],
    distance: number,
  ): void {
    const wrapAt = this.windowHeight + this.config.symbolHeight;

    this.landingTargets.clear();

    for (const view of this.symbolViews) {
      let finalY = view.container.y + distance;

      while (finalY >= wrapAt) {
        finalY -= this.stripHeight;
      }

      const row = Math.round(finalY / this.config.symbolHeight);
      const landsInWindow =
        row >= 0 && row < this.rows && symbolIds[row] !== undefined;

      view.row = landsInWindow ? row : -1;

      if (landsInWindow) {
        this.landingTargets.set(view, symbolIds[row]);
      }
    }
  }

  private setSymbol(view: SymbolView, symbolId: SymbolId): void {
    const symbol = this.symbolsById.get(symbolId);

    view.text.text = symbol?.glyph ?? "?";
  }

  private updateAnticipation(deltaMS: number): void {
    if (!this.anticipating) {
      return;
    }

    this.anticipationElapsed += deltaMS;

    const { anticipationMinAlpha, anticipationMaxAlpha } = this.theme;

    this.anticipationFrame.alpha =
      anticipationMinAlpha +
      oscillate(
        this.anticipationElapsed,
        this.config.anticipationPulseDuration,
      ) *
        (anticipationMaxAlpha - anticipationMinAlpha);
  }

  private updateWin(deltaMS: number): void {
    const animation = this.winAnimation;

    if (!animation) {
      return;
    }

    animation.elapsed = Math.min(
      animation.elapsed + deltaMS,
      animation.duration,
    );

    const progress = animation.elapsed / animation.duration;
    const { cycles, scale, minAlpha } = this.theme.winPulse;
    const pulse = Math.abs(Math.sin(progress * Math.PI * cycles));

    for (const view of this.winViews) {
      view.text.scale.set(1 + pulse * scale);
      view.text.alpha = minAlpha + pulse * (1 - minAlpha);
    }

    if (progress < 1) {
      return;
    }

    this.resetWinViews();
    this.winViews.length = 0;
    this.winAnimation = null;

    animation.resolve();
  }

  private resetWinViews(): void {
    for (const view of this.winViews) {
      view.text.scale.set(1);
      view.text.alpha = 1;
    }
  }
}
