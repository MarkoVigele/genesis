import type { Quality } from "../quality";
import type { StageCursor } from "../timeline";

type Particle = {
  x: number;
  y: number;
  z: number;
  hue: number;
  size: number;
};

const BACKGROUNDS = [
  "#140510",
  "#120806",
  "#16100c",
  "#07060f",
  "#05060c",
  "#03040a",
  "#0a0806",
  "#04050a",
];

export class FallbackSky {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly particles: Particle[];
  private readonly dpr: number;
  private elapsed = 0;
  private cursor: StageCursor | null = null;

  constructor(canvas: HTMLCanvasElement, quality: Quality) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("2d context unavailable");
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.dpr = quality.pixelRatio;
    const count = quality.mobile ? 720 : 1400;
    this.particles = [];
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
        hue: Math.random(),
        size: 0.6 + Math.random() * 1.8,
      });
    }
    this.resize();
  }

  resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
  }

  setProgress(cursor: StageCursor, dt: number): void {
    this.cursor = cursor;
    this.elapsed += dt;
  }

  render(): void {
    const cursor = this.cursor;
    if (!cursor) return;
    const { ctx, canvas, elapsed } = this;
    const w = canvas.width;
    const h = canvas.height;
    const bg = BACKGROUNDS[cursor.index] ?? BACKGROUNDS[0];
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg ?? "#05060a";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w * 0.5, h * 0.48);
    ctx.globalCompositeOperation = "lighter";
    const scale = Math.min(w, h) * 0.28;
    const { index, next, blend } = cursor;
    this.drawStage(index, 1 - blend * (index === next ? 0 : 1), scale, elapsed);
    if (next !== index) {
      this.drawStage(next, blend, scale, elapsed);
    }
    ctx.restore();

    const veil = ctx.createRadialGradient(w * 0.5, h * 0.5, scale * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.62);
    veil.addColorStop(0, "rgba(0,0,0,0)");
    veil.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, w, h);
  }

  dispose(): void {
    return;
  }

  private drawStage(index: number, alpha: number, scale: number, time: number): void {
    if (alpha < 0.03) return;
    this.ctx.globalAlpha = alpha;
    switch (index) {
      case 0:
        this.drawQuarks(scale, time);
        break;
      case 1:
        this.drawNuclei(scale, time);
        break;
      case 2:
        this.drawAtoms(scale, time);
        break;
      case 3:
        this.drawMolecules(scale, time);
        break;
      case 4:
        this.drawStars(scale, time);
        break;
      case 5:
        this.drawGalaxy(scale, time);
        break;
      case 6:
        this.drawSun(scale, time);
        break;
      default:
        this.drawPlanets(scale, time);
        break;
    }
    this.ctx.globalAlpha = 1;
  }

  private drawQuarks(scale: number, time: number): void {
    const { ctx, particles } = this;
    this.glow(0, 0, scale * 0.55, "rgba(255,70,140,0.28)");
    for (const p of particles) {
      const swirl = time * 1.4;
      const x = (p.x * Math.cos(swirl + p.z) - p.z * Math.sin(swirl + p.x)) * scale * 0.85;
      const y = (p.y + Math.sin(time * 2 + p.x * 6) * 0.12) * scale * 0.7;
      ctx.fillStyle = p.hue < 0.33 ? "#ff4f8d" : p.hue < 0.66 ? "#3cefff" : "#ffc24d";
      ctx.beginPath();
      ctx.arc(x, y, p.size * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawNuclei(scale: number, time: number): void {
    const { ctx } = this;
    const clusters = 36;
    for (let c = 0; c < clusters; c += 1) {
      const a = (c / clusters) * Math.PI * 2 + time * 0.12;
      const r = scale * (0.15 + (c % 7) * 0.09);
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a * 1.1) * r * 0.72;
      const n = c % 5 === 0 ? 4 : c % 2 === 0 ? 2 : 1;
      for (let i = 0; i < n; i += 1) {
        const ox = Math.cos(i * 1.8 + time) * 7;
        const oy = Math.sin(i * 1.8 + time) * 7;
        ctx.fillStyle = i % 2 === 0 ? "#ffe7d2" : "#7fb0ff";
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawAtoms(scale: number, time: number): void {
    const { ctx } = this;
    this.glow(0, 0, scale * 1.4, "rgba(255,170,110,0.16)");
    for (let i = 0; i < 5; i += 1) {
      const cx = (i - 2) * scale * 0.32;
      const cy = Math.sin(i + time * 0.3) * scale * 0.18;
      ctx.strokeStyle = "rgba(210,220,255,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22 + i * 4, 10 + i, time * 0.4 + i, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffc48a";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMolecules(scale: number, time: number): void {
    const { ctx, particles } = this;
    for (let i = 0; i < 8; i += 1) {
      const x = Math.cos(i * 0.9 + time * 0.15) * scale * 0.55;
      const y = Math.sin(i * 1.2 + time * 0.12) * scale * 0.32;
      const color = i % 2 === 0 ? "rgba(160,80,255,0.18)" : "rgba(40,190,170,0.16)";
      this.glow(x, y, scale * 0.55, color);
    }
    for (const p of particles) {
      const x = p.x * scale * 1.1 + Math.sin(time + p.y * 4) * 8;
      const y = p.y * scale * 0.55;
      ctx.fillStyle = p.hue > 0.5 ? "rgba(255,120,150,0.35)" : "rgba(80,220,200,0.3)";
      ctx.beginPath();
      ctx.arc(x, y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStars(scale: number, time: number): void {
    const { ctx, particles } = this;
    this.drawMolecules(scale, time);
    for (let i = 0; i < particles.length; i += 11) {
      const p = particles[i];
      if (!p) continue;
      const x = p.x * scale * 0.9;
      const y = p.y * scale * 0.55;
      this.glow(x, y, 18 + (i % 5) * 4, "rgba(255,240,210,0.55)");
      ctx.fillStyle = "#fff6e0";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGalaxy(scale: number, time: number): void {
    const { ctx, particles } = this;
    this.glow(0, 0, scale * 0.35, "rgba(255,220,150,0.35)");
    for (let arm = 0; arm < 4; arm += 1) {
      for (let s = 0; s < 90; s += 1) {
        const t = s / 90;
        const r = scale * (0.08 + t * 1.15);
        const a = arm * (Math.PI / 2) + t * 3.1 + time * 0.18;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.42;
        ctx.fillStyle = t < 0.25 ? "#ffe7b0" : "#8cb0ff";
        ctx.beginPath();
        ctx.arc(x, y, t < 0.2 ? 2.4 : 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const p of particles) {
      if (p.hue > 0.82) {
        ctx.fillStyle = "#d8e6ff";
        ctx.beginPath();
        ctx.arc(p.x * scale * 1.3, p.y * scale * 0.7, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawSun(scale: number, time: number): void {
    const { ctx, particles } = this;
    this.glow(0, 0, scale * 0.95, "rgba(255,180,70,0.35)");
    this.glow(0, 0, scale * 0.45, "rgba(255,230,160,0.7)");
    ctx.fillStyle = "#ffd27a";
    ctx.beginPath();
    ctx.arc(0, 0, scale * 0.18, 0, Math.PI * 2);
    ctx.fill();
    for (const p of particles) {
      const a = time * 0.25 + p.hue * Math.PI * 2;
      const r = scale * (0.22 + Math.abs(p.x) * 0.12);
      ctx.fillStyle = "rgba(255,160,60,0.35)";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.35, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPlanets(scale: number, time: number): void {
    const { ctx } = this;
    this.glow(0, 0, scale * 0.42, "rgba(255,190,80,0.28)");
    ctx.fillStyle = "#ffd27a";
    ctx.beginPath();
    ctx.arc(0, 0, scale * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(210,180,120,0.18)";
    for (let i = 0; i < 90; i += 1) {
      const t = i / 90;
      const r = scale * (0.22 + t * 0.95);
      const a = t * Math.PI * 2;
      ctx.fillStyle = `rgba(180,160,120,${0.08 + t * 0.12})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.32, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const planets = [
      { r: 0.28, size: 4, color: "#9aa0a8", speed: 1.3 },
      { r: 0.4, size: 6, color: "#e8d09a", speed: 1.05 },
      { r: 0.52, size: 6.5, color: "#6f9fd4", speed: 0.84 },
      { r: 0.64, size: 5, color: "#c46a3a", speed: 0.7 },
      { r: 0.82, size: 11, color: "#d4a46a", speed: 0.42 },
      { r: 1.02, size: 9, color: "#e0c48a", speed: 0.3 },
    ];
    for (let i = 0; i < planets.length; i += 1) {
      const spec = planets[i];
      if (!spec) continue;
      const a = time * spec.speed + i;
      const x = Math.cos(a) * scale * spec.r;
      const y = Math.sin(a) * scale * spec.r * 0.32;
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * spec.r, scale * spec.r * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(x, y, spec.size, 0, Math.PI * 2);
      ctx.fill();
      if (i === 5) {
        ctx.strokeStyle = "rgba(220,200,150,0.7)";
        ctx.beginPath();
        ctx.ellipse(x, y, spec.size * 2.1, spec.size * 0.55, 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private glow(x: number, y: number, radius: number, color: string): void {
    const { ctx } = this;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

