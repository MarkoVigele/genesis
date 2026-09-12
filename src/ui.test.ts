import assert from "node:assert/strict";
import { test } from "node:test";
import { playLabel } from "./ui";

test("play labels stay German and distinct for each transport state", () => {
  assert.equal(playLabel(true, false), "Pause");
  assert.equal(playLabel(false, false), "Abspielen");
  assert.equal(playLabel(false, true), "Von vorn");
  assert.equal(playLabel(true, true), "Von vorn");
});
