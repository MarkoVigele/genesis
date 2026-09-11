import { STAGE_COUNT, STAGES, type Stage } from "./stages";

/** Seconds the view stays settled on a station before the next morph begins. */
export const STAGE_HOLD_SECONDS = 14;

/** Seconds for the slow visual morph into the next station. */
export const STAGE_BLEND_SECONDS = 7;

/** Autoplay time per station: hold + morph. */
export const STAGE_SECONDS = STAGE_HOLD_SECONDS + STAGE_BLEND_SECONDS;

export const AUTOPLAY_SECONDS = STAGE_SECONDS * STAGE_COUNT;

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/** Perlin smootherstep — slow start and settle, no snappy crossfade. */
export function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Map linear intra-stage progress to a visual blend.
 * First STAGE_HOLD_SECONDS stay at 0 (settled); then ease across the morph.
 */
export function blendFromLocal(local: number): number {
  const holdFrac = STAGE_HOLD_SECONDS / STAGE_SECONDS;
  if (local <= holdFrac || holdFrac >= 1) return 0;
  return smootherstep((local - holdFrac) / (1 - holdFrac));
}

export type StageCursor = {
  index: number;
  next: number;
  /** Linear 0–1 position inside the current station (timeline / scrub). */
  local: number;
  /** 0 while holding, 0–1 while morphing toward `next`. Instant on scrub. */
  blend: number;
  floatStage: number;
  stage: Stage;
};

export function stageFromProgress(progress: number): StageCursor {
  const x = clamp01(progress) * STAGE_COUNT;
  if (x >= STAGE_COUNT) {
    const index = STAGE_COUNT - 1;
    const stage = STAGES[index];
    if (!stage) {
      throw new Error("missing last stage");
    }
    return { index, next: index, local: 1, blend: 0, floatStage: index, stage };
  }
  const index = Math.min(STAGE_COUNT - 1, Math.floor(x));
  const local = x - index;
  const next = Math.min(STAGE_COUNT - 1, index + 1);
  const stage = STAGES[index];
  if (!stage) {
    throw new Error("missing stage");
  }
  const blend = next === index ? 0 : blendFromLocal(local);
  return { index, next, local, blend, floatStage: index + blend, stage };
}

export function progressFromStage(index: number, local = 0): number {
  const safeIndex = Math.min(STAGE_COUNT - 1, Math.max(0, index));
  return clamp01((safeIndex + clamp01(local)) / STAGE_COUNT);
}

export function gate(floatStage: number, center: number, width: number): number {
  if (width <= 0) return 0;
  return Math.max(0, 1 - Math.abs(floatStage - center) / width);
}

export class Timeline {
  progress = 0;
  playing = true;

  get finished(): boolean {
    return this.progress >= 1 && !this.playing;
  }

  update(dt: number): void {
    if (!this.playing) return;
    this.progress = clamp01(this.progress + dt / AUTOPLAY_SECONDS);
    if (this.progress >= 1) {
      this.playing = false;
    }
  }

  toggle(): void {
    if (this.progress >= 1) {
      this.progress = 0;
      this.playing = true;
      return;
    }
    this.playing = !this.playing;
  }

  scrub(progress: number): void {
    this.progress = clamp01(progress);
    this.playing = false;
  }

  jumpTo(index: number): void {
    this.progress = progressFromStage(index, 0.08);
    this.playing = false;
  }
}
