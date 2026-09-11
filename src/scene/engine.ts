import type { Quality } from "../quality";
import type { StageCursor } from "../timeline";
import { Cosmos } from "./cosmos";
import { FallbackSky } from "./fallback";

export type VisualEngine = {
  setProgress(cursor: StageCursor, dt: number): void;
  render(): void;
  resize(): void;
  dispose(): void;
};

export function webglAvailable(): boolean {
  const probe = document.createElement("canvas");
  const opts: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    failIfMajorPerformanceCaveat: false,
  };
  const gl = probe.getContext("webgl2", opts) ?? probe.getContext("webgl", opts);
  return Boolean(gl);
}

export function createVisuals(canvas: HTMLCanvasElement, quality: Quality): VisualEngine {
  if (webglAvailable()) {
    try {
      return new Cosmos(canvas, quality);
    } catch {
      // Software GL or blocked contexts still happen on some devices.
    }
  }
  return new FallbackSky(canvas, quality);
}
