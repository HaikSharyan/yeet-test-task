import { Application } from "pixi.js";
import type { ApplicationOptions } from "pixi.js";

export class PixiRuntime {
  readonly app = new Application();

  private initialized = false;
  private destroyed = false;

  async mount(
    host: HTMLElement,
    options: Partial<ApplicationOptions>,
  ): Promise<boolean> {
    await this.app.init(options);
    this.initialized = true;

    if (this.destroyed) {
      this.app.destroy(true);
      return false;
    }

    this.app.canvas.style.display = "block";
    this.app.canvas.style.width = "100%";
    this.app.canvas.style.height = "auto";

    host.appendChild(this.app.canvas);

    return true;
  }

  destroy(): void {
    this.destroyed = true;

    if (this.initialized) {
      this.app.destroy(true, {
        children: true,
      });
    }
  }
}
