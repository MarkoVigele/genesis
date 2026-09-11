import { STAGE_COUNT, STAGES, type Stage } from "./stages";

export const STAGE_SECONDS = 7;

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export type StageCursor = {
  index: number;
  next: number;
  local: number;
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
    return { index, next: index, local: 1, floatStage: index, stage };
  }
  const index = Math.min(STAGE_COUNT - 1, Math.floor(x));
  const local = x - index;
  const next = Math.min(STAGE_COUNT - 1, index + 1);
  const stage = STAGES[index];
  if (!stage) {
    throw new Error("missing stage");
  }
  return { index, next, local, floatStage: index + local, stage };
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
    const span = STAGE_SECONDS * STAGE_COUNT;
    this.progress = clamp01(this.progress + dt / span);
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
