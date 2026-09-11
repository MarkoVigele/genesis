import assert from "node:assert/strict";
import { test } from "node:test";
import { STAGE_COUNT } from "../stages";
import { buildLayouts, layoutExtentY } from "./layout";

test("layouts exist for every timeline station", () => {
  const layouts = buildLayouts(240);
  assert.equal(layouts.length, STAGE_COUNT);
  for (const layout of layouts) {
    assert.equal(layout.length, 240 * 3);
  }
});

test("galaxy and planet disk stay flatter than the quark soup", () => {
  const layouts = buildLayouts(800);
  const quarks = layouts[0];
  const galaxy = layouts[5];
  const disk = layouts[7];
  assert.ok(quarks && galaxy && disk);
  const quarkExt = layoutExtentY(quarks);
  const galaxyExt = layoutExtentY(galaxy);
  const diskExt = layoutExtentY(disk);
  const quarkFlat = quarkExt.meanAbsY / Math.max(quarkExt.meanR, 0.001);
  const galaxyFlat = galaxyExt.meanAbsY / Math.max(galaxyExt.meanR, 0.001);
  const diskFlat = diskExt.meanAbsY / Math.max(diskExt.meanR, 0.001);
  assert.ok(galaxyFlat < quarkFlat);
  assert.ok(diskFlat < galaxyFlat);
  assert.ok(diskExt.meanR > 3);
});
