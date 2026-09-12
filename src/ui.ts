import { STAGES, type Stage } from "./stages";

export type UiHandles = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  play: HTMLButtonElement;
  scrub: HTMLInputElement;
  name: HTMLElement;
  era: HTMLElement;
  caption: HTMLElement;
  ticks: HTMLButtonElement[];
};

export function playLabel(playing: boolean, finished: boolean): string {
  if (finished) return "Von vorn";
  return playing ? "Pause" : "Abspielen";
}

export function setScrubProgress(ui: UiHandles, progress: number): void {
  const clamped = Math.min(1, Math.max(0, progress));
  ui.scrub.value = String(Math.round(clamped * 1000));
  ui.scrub.style.setProperty("--progress", `${(clamped * 100).toFixed(2)}%`);
}

export function mountUi(host: HTMLElement): UiHandles {
  host.innerHTML = `
    <canvas id="stage" aria-hidden="true"></canvas>
    <div class="vignette"></div>
    <header class="hud-top">
      <div class="brand">
        <p class="kicker">Genesis</p>
        <h1 id="stage-name">Quarks</h1>
        <p id="stage-era" class="era">Heißes Plasma</p>
      </div>
      <button id="play" class="play" type="button" aria-label="Pause">Pause</button>
    </header>
    <footer class="hud-bottom">
      <div class="transport">
        <p id="caption" class="caption"></p>
        <div class="transport-controls">
          <input
            id="scrub"
            type="range"
            min="0"
            max="1000"
            value="0"
            step="1"
            aria-label="Zeitlinie"
          />
          <div class="ticks" role="tablist" aria-label="Stationen"></div>
        </div>
      </div>
    </footer>
  `;

  const canvas = host.querySelector("#stage");
  const play = host.querySelector("#play");
  const scrub = host.querySelector("#scrub");
  const name = host.querySelector("#stage-name");
  const era = host.querySelector("#stage-era");
  const caption = host.querySelector("#caption");
  const tickHost = host.querySelector(".ticks");
  if (
    !(canvas instanceof HTMLCanvasElement) ||
    !(play instanceof HTMLButtonElement) ||
    !(scrub instanceof HTMLInputElement) ||
    !(name instanceof HTMLElement) ||
    !(era instanceof HTMLElement) ||
    !(caption instanceof HTMLElement) ||
    !(tickHost instanceof HTMLElement)
  ) {
    throw new Error("ui mount failed");
  }

  const ticks: HTMLButtonElement[] = [];
  for (const stage of STAGES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tick";
    button.dataset.stage = stage.id;
    button.setAttribute("role", "tab");
    button.innerHTML = `<span class="tick-label">${stage.label}</span>`;
    tickHost.append(button);
    ticks.push(button);
  }

  return { root: host, canvas, play, scrub, name, era, caption, ticks };
}

export function renderUi(
  ui: UiHandles,
  stage: Stage,
  progress: number,
  playing: boolean,
  finished: boolean,
): void {
  ui.name.textContent = stage.label;
  ui.era.textContent = stage.era;
  ui.caption.textContent = stage.caption;
  setScrubProgress(ui, progress);
  const label = playLabel(playing, finished);
  ui.play.textContent = label;
  ui.play.setAttribute("aria-label", label);
  ui.play.classList.toggle("is-playing", playing && !finished);
  ui.play.classList.toggle("is-paused", !playing && !finished);
  ui.play.classList.toggle("is-finished", finished);
  for (const tick of ui.ticks) {
    const active = tick.dataset.stage === stage.id;
    tick.classList.toggle("is-active", active);
    tick.setAttribute("aria-selected", active ? "true" : "false");
    tick.tabIndex = active ? 0 : -1;
  }
}
