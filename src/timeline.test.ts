import assert from "node:assert/strict";
import { test } from "node:test";
import { STAGE_COUNT, STAGE_IDS, STAGES } from "./stages";
import { clamp01, progressFromStage, stageFromProgress } from "./timeline";

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

test("stageFromProgress maps the eight stations", () => {
  assert.equal(stageFromProgress(0).index, 0);
  assert.equal(stageFromProgress(0).stage.id, "quarks");
  assert.equal(stageFromProgress(1).index, 7);
  assert.equal(stageFromProgress(1).stage.id, "planets");
  assert.equal(stageFromProgress(1).local, 1);

  const midGalaxy = stageFromProgress(5.5 / 8);
  assert.equal(midGalaxy.stage.id, "galaxy");
  assert.ok(midGalaxy.local > 0.4 && midGalaxy.local < 0.6);

  const intoSun = stageFromProgress(6.2 / 8);
  assert.equal(intoSun.stage.id, "sun");
  assert.equal(intoSun.next, 7);
});

test("progress helpers stay in range", () => {
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(2), 1);
  assert.ok(progressFromStage(0) < progressFromStage(1));
  assert.equal(progressFromStage(7, 1), 1);
  assert.equal(progressFromStage(99), progressFromStage(7));
});
