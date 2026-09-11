import "./styles.css";
import { detectQuality } from "./quality";
import { Cosmos } from "./scene/cosmos";
import { STAGES } from "./stages";
import { Timeline, stageFromProgress } from "./timeline";
import { mountUi, renderUi } from "./ui";

const host = document.querySelector("#app");
if (!(host instanceof HTMLElement)) {
  throw new Error("app host missing");
}

const ui = mountUi(host);
const timeline = new Timeline();
const cosmos = new Cosmos(ui.canvas, detectQuality());

let lastUiIndex = -1;
let lastPlaying = timeline.playing;
let lastFinished = timeline.finished;

const paintUi = (): void => {
  const cursor = stageFromProgress(timeline.progress);
  renderUi(ui, cursor.stage, timeline.progress, timeline.playing, timeline.finished);
  lastUiIndex = cursor.index;
  lastPlaying = timeline.playing;
  lastFinished = timeline.finished;
};

ui.play.addEventListener("click", () => {
  timeline.toggle();
  paintUi();
});

ui.scrub.addEventListener("input", () => {
  timeline.scrub(Number(ui.scrub.value) / 1000);
  paintUi();
});

ui.ticks.forEach((tick, index) => {
  tick.addEventListener("click", () => {
    timeline.jumpTo(index);
    paintUi();
  });
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    timeline.toggle();
    paintUi();
    return;
  }
  if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
    event.preventDefault();
    const cursor = stageFromProgress(timeline.progress);
    const next = event.code === "ArrowRight" ? cursor.index + 1 : cursor.index - 1;
    timeline.jumpTo(Math.min(STAGES.length - 1, Math.max(0, next)));
    paintUi();
  }
});

window.addEventListener("resize", () => cosmos.resize());
window.visualViewport?.addEventListener("resize", () => cosmos.resize());

let last = performance.now();
const loop = (now: number): void => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  timeline.update(dt);
  const cursor = stageFromProgress(timeline.progress);
  cosmos.setProgress(cursor, dt);
  cosmos.render();
  if (cursor.index !== lastUiIndex || timeline.playing !== lastPlaying || timeline.finished !== lastFinished) {
    paintUi();
  } else if (timeline.playing) {
    ui.scrub.value = String(Math.round(timeline.progress * 1000));
  }
  requestAnimationFrame(loop);
};

paintUi();
requestAnimationFrame(loop);
