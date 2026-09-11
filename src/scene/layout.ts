import { STAGE_COUNT } from "../stages";

const TWO_PI = Math.PI * 2;

export function fract(value: number): number {
  return value - Math.floor(value);
}

export function hash2(i: number, salt: number): number {
  return fract(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123);
}

export function gauss(i: number, salt: number): number {
  const u = Math.max(1e-6, hash2(i, salt));
  const v = hash2(i, salt + 19);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v);
}

export function writeVec(
  target: Float32Array,
  i: number,
  x: number,
  y: number,
  z: number,
): void {
  const o = i * 3;
  target[o] = x;
  target[o + 1] = y;
  target[o + 2] = z;
}

function onSphere(i: number, salt: number, radius: number): [number, number, number] {
  const u = hash2(i, salt);
  const v = hash2(i, salt + 3);
  const theta = TWO_PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(hash2(i, salt + 7));
  const s = Math.sin(phi);
  return [r * s * Math.cos(theta), r * Math.cos(phi), r * s * Math.sin(theta)];
}

type LayoutWriter = (i: number, out: Float32Array) => void;

function quarks(i: number, out: Float32Array): void {
  const [x, y, z] = onSphere(i, 1, 7.2);
  writeVec(out, i, x, y, z);
}

function nuclei(i: number, out: Float32Array): void {
  const clusters = 52;
  const cluster = i % clusters;
  const kind = cluster % 5;
  const nucleons = kind === 4 ? 4 : kind >= 2 ? 2 : 1;
  const member = Math.floor(i / clusters) % nucleons;
  const [cx, cy, cz] = onSphere(cluster, 21, 8.4);
  const pair = member * 1.7;
  const ox = Math.cos(pair) * 0.16;
  const oy = (member - (nucleons - 1) * 0.5) * 0.14;
  const oz = Math.sin(pair) * 0.16;
  writeVec(out, i, cx + ox, cy + oy, cz + oz);
}

function atoms(i: number, out: Float32Array): void {
  nuclei(i, out);
  const o = i * 3;
  const cx = out[o] ?? 0;
  const cy = out[o + 1] ?? 0;
  const cz = out[o + 2] ?? 0;
  const shell = hash2(i, 40) > 0.55;
  const expand = 1.28;
  if (shell) {
    const a = hash2(i, 41) * TWO_PI;
    const b = hash2(i, 42) * TWO_PI;
    const r = 0.55 + hash2(i, 43) * 0.45;
    writeVec(
      out,
      i,
      cx * expand + Math.cos(a) * r,
      cy * expand + Math.sin(b) * r * 0.45,
      cz * expand + Math.sin(a) * r,
    );
    return;
  }
  writeVec(out, i, cx * expand, cy * expand, cz * expand);
}

function molecules(i: number, out: Float32Array): void {
  const filament = hash2(i, 50) > 0.38;
  if (filament) {
    const t = hash2(i, 51);
    const theta = t * 14 * Math.PI;
    const r = 3.2 + 9.5 * hash2(i, 52);
    writeVec(
      out,
      i,
      r * Math.cos(theta) + 1.6 * Math.sin(3 * theta),
      2.4 * Math.sin(2 * theta + hash2(i, 53) * TWO_PI),
      r * Math.sin(theta) + 1.1 * Math.cos(2.4 * theta),
    );
    return;
  }
  const blob = Math.floor(hash2(i, 54) * 7);
  const [bx, by, bz] = onSphere(blob, 60, 6.5);
  const [x, y, z] = onSphere(i, 61, 2.8);
  writeVec(out, i, bx + x, by + y * 0.7, bz + z);
}

function stars(i: number, out: Float32Array): void {
  molecules(i, out);
  const seed = Math.floor(hash2(i, 70) * 64);
  if (hash2(i, 71) > 0.92) {
    const [x, y, z] = onSphere(seed, 72, 9.5);
    writeVec(out, i, x, y, z);
  }
}

function galaxy(i: number, out: Float32Array): void {
  const arms = 4;
  const arm = i % arms;
  const t = hash2(i, 80);
  const bulge = hash2(i, 81) < 0.16;
  if (bulge) {
    const [x, y, z] = onSphere(i, 82, 2.4);
    writeVec(out, i, x * 0.85, y * 0.55, z * 0.85);
    return;
  }
  const r = 0.6 + 15.8 * t ** 0.62;
  const twist = r * 0.52;
  const theta = arm * (Math.PI * 0.5) + twist + (hash2(i, 83) - 0.5) * 0.4;
  const spread = (hash2(i, 84) - 0.5) * (0.55 + r * 0.07);
  const x = (r + spread) * Math.cos(theta);
  const z = (r + spread) * Math.sin(theta);
  const y = gauss(i, 85) * (0.28 + (1 - r / 17) * 0.85);
  writeVec(out, i, x, y, z);
}

function sunField(i: number, out: Float32Array): void {
  if (hash2(i, 90) < 0.2) {
    const [x, y, z] = onSphere(i, 91, 2.35);
    writeVec(out, i, x, y, z);
    return;
  }
  const [x, y, z] = onSphere(i, 92, 42 + hash2(i, 93) * 36);
  writeVec(out, i, x, y, z);
}

function planetDisk(i: number, out: Float32Array): void {
  if (hash2(i, 100) < 0.08) {
    const [x, y, z] = onSphere(i, 101, 40);
    writeVec(out, i, x, y * 0.35, z);
    return;
  }
  const r = 2.6 + 13.5 * Math.sqrt(hash2(i, 102));
  const theta = hash2(i, 103) * TWO_PI;
  const y = gauss(i, 104) * (0.14 + r * 0.008);
  writeVec(out, i, Math.cos(theta) * r, y, Math.sin(theta) * r);
}

const BUILDERS: readonly LayoutWriter[] = [
  quarks,
  nuclei,
  atoms,
  molecules,
  stars,
  galaxy,
  sunField,
  planetDisk,
];

export function buildLayouts(count: number): Float32Array[] {
  const layouts: Float32Array[] = [];
  for (let s = 0; s < STAGE_COUNT; s += 1) {
    const data = new Float32Array(count * 3);
    const builder = BUILDERS[s];
    if (!builder) continue;
    for (let i = 0; i < count; i += 1) {
      builder(i, data);
    }
    layouts.push(data);
  }
  return layouts;
}

export function layoutExtentY(data: Float32Array): { meanAbsY: number; meanR: number } {
  const n = data.length / 3;
  let absY = 0;
  let r = 0;
  for (let i = 0; i < n; i += 1) {
    const x = data[i * 3] ?? 0;
    const y = data[i * 3 + 1] ?? 0;
    const z = data[i * 3 + 2] ?? 0;
    absY += Math.abs(y);
    r += Math.hypot(x, z);
  }
  return { meanAbsY: absY / n, meanR: r / n };
}
