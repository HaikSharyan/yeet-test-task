import { useImperativeHandle, useRef } from "react";
import type { RefObject } from "react";

export interface PerformancePanelHandle {
  update: (fps: number, maxFrameTime: number) => void;
}

interface PerformancePanelProps {
  controllerRef: RefObject<PerformancePanelHandle | null>;
}

export function PerformancePanel({ controllerRef }: PerformancePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLElement>(null);

  useImperativeHandle(
    controllerRef,
    () => ({
      update(fps, maxFrameTime) {
        const rootElement = rootRef.current;
        const fpsElement = fpsRef.current;
        const frameElement = frameRef.current;
        const barElement = barRef.current;

        if (!rootElement || !fpsElement || !frameElement || !barElement) {
          return;
        }

        const formattedFps = fps.toFixed(1);
        const formattedFrameTime = maxFrameTime.toFixed(1);
        const frameRateRatio = Math.min(fps / 60, 1);

        fpsElement.textContent = `${formattedFps} fps`;
        frameElement.textContent = `${formattedFrameTime} ms`;
        barElement.style.transform = `scaleX(${frameRateRatio})`;
        rootElement.setAttribute(
          "aria-label",
          `${formattedFps} frames per second, ${formattedFrameTime} milliseconds maximum frame time`,
        );
      },
    }),
    [],
  );

  return (
    <div
      ref={rootRef}
      className="performance"
      aria-label="Performance data loading"
      title="Sampled PixiJS frame performance"
    >
      <div className="performance__metric">
        <span>Frame rate</span>
        <strong ref={fpsRef}>-- fps</strong>
      </div>

      <div className="performance__bar" aria-hidden="true">
        <span ref={barRef} />
      </div>

      <div className="performance__metric performance__metric--secondary">
        <span>Max frame</span>
        <strong ref={frameRef}>-- ms</strong>
      </div>

      <small>sample window</small>
    </div>
  );
}
