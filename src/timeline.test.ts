import assert from "node:assert/strict";
import { test } from "node:test";
import { STAGE_COUNT, STAGE_IDS, STAGES } from "./stages";
import {
  AUTOPLAY_SECONDS,
  STAGE_BLEND_SECONDS,
  STAGE_HOLD_SECONDS,
  STAGE_SECONDS,
  Timeline,
  blendFromLocal,
  clamp01,
  progressFromStage,
  stageFromProgress,
  smootherstep,
} from "./timeline";

test("scientific order keeps the galaxy before the sun", () => {
  assert.deepEqual([...STAGE_IDS], [
    "quarks",
    "nuclei",
    "atoms",
    "molecules",
    "stars",
    "galaxy",
    "sun",
    "planets",
  ]);
  assert.equal(STAGES[5]?.id, "galaxy");
  assert.equal(STAGES[6]?.id, "sun");
  assert.equal(STAGE_COUNT, 8);
});

test("autoplay lingers long enough to read each station", () => {
  assert.equal(STAGE_HOLD_SECONDS, 14);
  assert.equal(STAGE_BLEND_SECONDS, 7);
  assert.equal(STAGE_SECONDS, 21);
  assert.equal(AUTOPLAY_SECONDS, STAGE_SECONDS * STAGE_COUNT);
  assert.ok(STAGE_SECONDS >= 18 && STAGE_SECONDS <= 22);
  assert.ok(AUTOPLAY_SECONDS >= 150 && AUTOPLAY_SECONDS <= 180);
});

test("stageFromProgress maps the eight stations", () => {
  assert.equal(stageFromProgress(0).index, 0);
  assert.equal(stageFromProgress(0).stage.id, "quarks");
  assert.equal(stageFromProgress(0).blend, 0);
  assert.equal(stageFromProgress(1).index, 7);
  assert.equal(stageFromProgress(1).stage.id, "planets");
  assert.equal(stageFromProgress(1).local, 1);
  assert.equal(stageFromProgress(1).blend, 0);

  const midGalaxy = stageFromProgress(5.5 / 8);
  assert.equal(midGalaxy.stage.id, "galaxy");
  assert.ok(midGalaxy.local > 0.4 && midGalaxy.local < 0.6);
  assert.equal(midGalaxy.blend, 0);
  assert.equal(midGalaxy.floatStage, 5);

  const intoSun = stageFromProgress(6.2 / 8);
  assert.equal(intoSun.stage.id, "sun");
  assert.equal(intoSun.next, 7);
  assert.equal(intoSun.blend, 0);
});

test("hold stays settled, then morphs slowly toward the next station", () => {
  const holdFrac = STAGE_HOLD_SECONDS / STAGE_SECONDS;
  assert.equal(blendFromLocal(0), 0);
  assert.equal(blendFromLocal(holdFrac), 0);
  assert.equal(blendFromLocal(holdFrac * 0.5), 0);
  assert.ok(blendFromLocal(holdFrac + 0.02) > 0);
  assert.ok(blendFromLocal(holdFrac + 0.02) < 0.08);
  assert.equal(blendFromLocal(1), 1);
  assert.ok(smootherstep(0.5) > 0.49 && smootherstep(0.5) < 0.51);

  const lateGalaxy = stageFromProgress((5 + 0.92) / STAGE_COUNT);
  assert.equal(lateGalaxy.stage.id, "galaxy");
  assert.ok(lateGalaxy.blend > 0.7);
  assert.ok(lateGalaxy.blend < 1);
  assert.ok(lateGalaxy.floatStage > 5.7);
  assert.ok(lateGalaxy.floatStage < 6);

  const lastStation = stageFromProgress((7 + 0.95) / STAGE_COUNT);
  assert.equal(lastStation.stage.id, "planets");
  assert.equal(lastStation.blend, 0);
  assert.equal(lastStation.floatStage, 7);
});

test("progress helpers stay in range", () => {
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(2), 1);
  assert.ok(progressFromStage(0) < progressFromStage(1));
  assert.equal(progressFromStage(7, 1), 1);
  assert.equal(progressFromStage(99), progressFromStage(7));
});

test("autoplay advances one station per STAGE_SECONDS", () => {
  const timeline = new Timeline();
  assert.equal(timeline.playing, true);
  timeline.update(STAGE_SECONDS);
  const afterFirst = stageFromProgress(timeline.progress);
  assert.equal(afterFirst.index, 1);
  assert.ok(afterFirst.local < 0.02);
  assert.equal(afterFirst.blend, 0);

  timeline.update(STAGE_SECONDS * (STAGE_COUNT - 1));
  assert.equal(timeline.progress, 1);
  assert.equal(timeline.playing, false);
  assert.equal(timeline.finished, true);
});

test("scrub and jump land immediately without autoplay lag", () => {
  const timeline = new Timeline();
  timeline.update(STAGE_SECONDS * 2);
  timeline.scrub(0.9);
  assert.equal(timeline.playing, false);
  assert.equal(timeline.progress, 0.9);
  const scrubbed = stageFromProgress(timeline.progress);
  assert.equal(scrubbed.stage.id, "planets");

  timeline.jumpTo(3);
  assert.equal(timeline.playing, false);
  const jumped = stageFromProgress(timeline.progress);
  assert.equal(jumped.index, 3);
  assert.equal(jumped.stage.id, "molecules");
  assert.ok(jumped.local > 0 && jumped.local < 0.2);
  assert.equal(jumped.blend, 0);
});
