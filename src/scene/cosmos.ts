import * as THREE from "three";
import { gate, type StageCursor } from "../timeline";
import type { Quality } from "../quality";
import { buildLayouts } from "./layout";
import { makeGlowTexture } from "./textures";

const BG = [
  new THREE.Color(0x1a0614),
  new THREE.Color(0x140a08),
  new THREE.Color(0x1a100c),
  new THREE.Color(0x07060e),
  new THREE.Color(0x05060c),
  new THREE.Color(0x03040a),
  new THREE.Color(0x07060a),
  new THREE.Color(0x04050a),
];

const PALETTES = [
  [
    new THREE.Color(0xff3f8c),
    new THREE.Color(0x33f0ff),
    new THREE.Color(0xffc14a),
  ],
  [
    new THREE.Color(0xff8a58),
    new THREE.Color(0xf4f6ff),
    new THREE.Color(0x73a6ff),
  ],
  [
    new THREE.Color(0xffb56e),
    new THREE.Color(0xf0d2b0),
    new THREE.Color(0x6a7394),
  ],
  [
    new THREE.Color(0xb25cff),
    new THREE.Color(0x33c2b0),
    new THREE.Color(0xff6f88),
  ],
  [
    new THREE.Color(0x8cbcff),
    new THREE.Color(0xfff4d6),
    new THREE.Color(0xff9a4a),
  ],
  [
    new THREE.Color(0x6a93ff),
    new THREE.Color(0xffe7b0),
    new THREE.Color(0xb56a4a),
  ],
  [
    new THREE.Color(0xffd56a),
    new THREE.Color(0xfff2c4),
    new THREE.Color(0xff7a32),
  ],
  [
    new THREE.Color(0x8aa0d4),
    new THREE.Color(0xe2b46a),
    new THREE.Color(0x4f7ad4),
  ],
] as const;

const CAM: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: new THREE.Vector3(0.4, 1.8, 13.5), look: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(2.2, 2.6, 15.5), look: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(0.8, 3.4, 18.5), look: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(7.5, 5.8, 26), look: new THREE.Vector3(0, 0.4, 0) },
  { pos: new THREE.Vector3(6.2, 7.4, 30), look: new THREE.Vector3(0, 0.6, 0) },
  { pos: new THREE.Vector3(0.2, 21, 36), look: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(0.6, 2.4, 16.5), look: new THREE.Vector3(0, 0, 0) },
  { pos: new THREE.Vector3(9.5, 8.8, 20.5), look: new THREE.Vector3(0, 0, 0) },
];

const PLANETS = [
  { radius: 0.16, orbit: 3.4, color: 0x9aa0a8, speed: 1.35, tilt: 0.02 },
  { radius: 0.22, orbit: 4.5, color: 0xe8d09a, speed: 1.05, tilt: 0.04 },
  { radius: 0.24, orbit: 5.7, color: 0x6f9fd4, speed: 0.84, tilt: 0.08 },
  { radius: 0.18, orbit: 6.9, color: 0xc46a3a, speed: 0.7, tilt: 0.05 },
  { radius: 0.48, orbit: 9.4, color: 0xd4a46a, speed: 0.42, tilt: 0.03 },
  { radius: 0.4, orbit: 12.1, color: 0xe0c48a, speed: 0.3, tilt: 0.1, ring: true },
] as const;

const sparkVert = `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
varying float vAlpha;
uniform float uPixelRatio;
void main() {
  vColor = aColor;
  vAlpha = 1.0;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(1.2, -mv.z);
  gl_PointSize = aSize * uPixelRatio * (210.0 / dist);
  gl_Position = projectionMatrix * mv;
}
`;

const sparkFrag = `
uniform sampler2D uMap;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 glow = texture2D(uMap, gl_PointCoord);
  float a = glow.a * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * glow.rgb, a);
}
`;

function pickColor(stage: number, i: number, out: THREE.Color): THREE.Color {
  const palette = PALETTES[stage] ?? PALETTES[0];
  const slot = i % 3;
  const color = palette?.[slot] ?? palette?.[0];
  if (!color) {
    return out.setRGB(1, 1, 1);
  }
  return out.copy(color);
}

function markAttr(geo: THREE.BufferGeometry, name: string): void {
  const attr = geo.getAttribute(name);
  if (attr) attr.needsUpdate = true;
}

function lerpLayouts(
  a: Float32Array,
  b: Float32Array,
  t: number,
  i: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const o = i * 3;
  const ax = a[o] ?? 0;
  const ay = a[o + 1] ?? 0;
  const az = a[o + 2] ?? 0;
  const bx = b[o] ?? 0;
  const by = b[o + 1] ?? 0;
  const bz = b[o + 2] ?? 0;
  out.set(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
  return out;
}

export class Cosmos {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);

  private readonly quality: Quality;
  private readonly glow: THREE.CanvasTexture;
  private readonly sparkGeo: THREE.BufferGeometry;
  private readonly sparkPos: Float32Array;
  private readonly sparkColor: Float32Array;
  private readonly sparkSize: Float32Array;
  private readonly sparkLayouts: Float32Array[];
  private readonly cloudGeo: THREE.BufferGeometry;
  private readonly cloudPos: Float32Array;
  private readonly cloudColor: Float32Array;
  private readonly cloudSize: Float32Array;
  private readonly cloudLayouts: Float32Array[];
  private readonly sparkMat: THREE.ShaderMaterial;
  private readonly cloudMat: THREE.ShaderMaterial;
  private readonly sparkPoints: THREE.Points;
  private readonly cloudPoints: THREE.Points;
  private readonly starfield: THREE.Points;
  private readonly plasma: THREE.Mesh;
  private readonly cmb: THREE.Mesh;
  private readonly rings: THREE.Line[];
  private readonly sun: THREE.Mesh;
  private readonly sunGlow: THREE.Sprite;
  private readonly planets: THREE.Group;
  private readonly planetMeshes: THREE.Mesh[];
  private readonly tmp = new THREE.Vector3();
  private readonly tmpColor = new THREE.Color();
  private readonly tmpColorB = new THREE.Color();
  private readonly bg = new THREE.Color();
  private readonly camPos = new THREE.Vector3();
  private readonly camLook = new THREE.Vector3();
  private elapsed = 0;

  constructor(canvas: HTMLCanvasElement, quality: Quality) {
    this.quality = quality;
    this.glow = makeGlowTexture(128);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !quality.mobile,
      alpha: false,
      powerPreference: quality.mobile ? "default" : "high-performance",
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setPixelRatio(quality.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.scene.background = new THREE.Color(0x05060a);
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.012);

    this.sparkLayouts = buildLayouts(quality.sparks);
    this.cloudLayouts = buildLayouts(quality.clouds);
    this.sparkPos = new Float32Array(quality.sparks * 3);
    this.sparkColor = new Float32Array(quality.sparks * 3);
    this.sparkSize = new Float32Array(quality.sparks);
    this.cloudPos = new Float32Array(quality.clouds * 3);
    this.cloudColor = new Float32Array(quality.clouds * 3);
    this.cloudSize = new Float32Array(quality.clouds);

    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute("position", new THREE.BufferAttribute(this.sparkPos, 3));
    this.sparkGeo.setAttribute("aColor", new THREE.BufferAttribute(this.sparkColor, 3));
    this.sparkGeo.setAttribute("aSize", new THREE.BufferAttribute(this.sparkSize, 1));

    this.cloudGeo = new THREE.BufferGeometry();
    this.cloudGeo.setAttribute("position", new THREE.BufferAttribute(this.cloudPos, 3));
    this.cloudGeo.setAttribute("aColor", new THREE.BufferAttribute(this.cloudColor, 3));
    this.cloudGeo.setAttribute("aSize", new THREE.BufferAttribute(this.cloudSize, 1));

    this.sparkMat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.glow },
        uPixelRatio: { value: quality.pixelRatio },
      },
      vertexShader: sparkVert,
      fragmentShader: sparkFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.cloudMat = this.sparkMat.clone();
    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.cloudPoints = new THREE.Points(this.cloudGeo, this.cloudMat);
    this.scene.add(this.sparkPoints, this.cloudPoints);

    this.starfield = this.makeStarfield(quality.starfield);
    this.scene.add(this.starfield);

    this.plasma = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff5aa8,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.plasma);

    this.cmb = new THREE.Mesh(
      new THREE.SphereGeometry(28, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffb27a,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    this.scene.add(this.cmb);

    this.rings = this.makeRings();
    for (const ring of this.rings) this.scene.add(ring);

    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true });
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 48), sunMat);
    this.sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glow,
        color: 0xffc85a,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.sunGlow.scale.set(7.4, 7.4, 1);
    this.scene.add(this.sun, this.sunGlow);

    this.planets = new THREE.Group();
    this.planetMeshes = [];
    for (const spec of PLANETS) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(spec.radius, 24, 24),
        new THREE.MeshBasicMaterial({ color: spec.color }),
      );
      this.planetMeshes.push(mesh);
      this.planets.add(mesh);
      if ("ring" in spec && spec.ring) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(spec.radius * 1.45, spec.radius * 2.25, 48),
          new THREE.MeshBasicMaterial({
            color: 0xd8c39a,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          }),
        );
        ring.rotation.x = Math.PI / 2.35;
        mesh.add(ring);
      }
    }
    this.scene.add(this.planets);

    this.camera.position.copy(CAM[0]?.pos ?? new THREE.Vector3(0, 2, 16));
    this.resize();
  }

  resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    const sparkRatio = this.sparkMat.uniforms.uPixelRatio;
    const cloudRatio = this.cloudMat.uniforms.uPixelRatio;
    if (sparkRatio) sparkRatio.value = this.renderer.getPixelRatio();
    if (cloudRatio) cloudRatio.value = this.renderer.getPixelRatio();
  }

  setProgress(cursor: StageCursor, dt: number): void {
    this.elapsed += dt;
    const { index, next, local, floatStage } = cursor;
    const from = this.sparkLayouts[index];
    const to = this.sparkLayouts[next];
    const cloudFrom = this.cloudLayouts[index];
    const cloudTo = this.cloudLayouts[next];
    if (!from || !to || !cloudFrom || !cloudTo) return;

    const quarkAmp = gate(floatStage, 0, 1.15) * 1.55;
    const cloudVis = Math.max(gate(floatStage, 3, 1.35), gate(floatStage, 4, 1.1));
    const sparkScale =
      1.15 +
      gate(floatStage, 0, 1) * 0.7 +
      gate(floatStage, 4, 0.9) * 0.9 +
      gate(floatStage, 6, 0.8) * 0.35;

    for (let i = 0; i < this.quality.sparks; i += 1) {
      lerpLayouts(from, to, local, i, this.tmp);
      if (quarkAmp > 0.01) {
        const t = this.elapsed;
        this.tmp.x += Math.sin(t * 1.7 + this.tmp.y * 0.45 + i * 0.01) * quarkAmp;
        this.tmp.y += Math.sin(t * 1.25 + this.tmp.z * 0.4) * quarkAmp * 0.85;
        this.tmp.z += Math.cos(t * 1.45 + this.tmp.x * 0.4) * quarkAmp;
      }
      this.sparkPos[i * 3] = this.tmp.x;
      this.sparkPos[i * 3 + 1] = this.tmp.y;
      this.sparkPos[i * 3 + 2] = this.tmp.z;

      pickColor(index, i, this.tmpColor);
      pickColor(next, i, this.tmpColorB);
      this.tmpColor.lerp(this.tmpColorB, local);
      this.sparkColor[i * 3] = this.tmpColor.r;
      this.sparkColor[i * 3 + 1] = this.tmpColor.g;
      this.sparkColor[i * 3 + 2] = this.tmpColor.b;

      const seed = (i % 17) / 17;
      let size = (0.55 + seed * 1.4) * sparkScale;
      if (index >= 4 || next >= 4) {
        const starry = i % 37 === 0;
        size = starry ? 2.6 + gate(floatStage, 4, 1) * 2.2 : size * 0.55;
      }
      this.sparkSize[i] = size;
    }

    for (let i = 0; i < this.quality.clouds; i += 1) {
      lerpLayouts(cloudFrom, cloudTo, local, i, this.tmp);
      this.cloudPos[i * 3] = this.tmp.x * 1.05;
      this.cloudPos[i * 3 + 1] = this.tmp.y * 0.85;
      this.cloudPos[i * 3 + 2] = this.tmp.z * 1.05;
      pickColor(index, i + 3, this.tmpColor);
      pickColor(next, i + 3, this.tmpColorB);
      this.tmpColor.lerp(this.tmpColorB, local);
      this.cloudColor[i * 3] = this.tmpColor.r;
      this.cloudColor[i * 3 + 1] = this.tmpColor.g;
      this.cloudColor[i * 3 + 2] = this.tmpColor.b;
      this.cloudSize[i] = (4.8 + (i % 5)) * (0.35 + cloudVis);
    }

    markAttr(this.sparkGeo, "position");
    markAttr(this.sparkGeo, "aColor");
    markAttr(this.sparkGeo, "aSize");
    markAttr(this.cloudGeo, "position");
    markAttr(this.cloudGeo, "aColor");
    markAttr(this.cloudGeo, "aSize");
    this.sparkGeo.computeBoundingSphere();
    this.cloudGeo.computeBoundingSphere();

    this.cloudPoints.visible = cloudVis > 0.04;

    this.plasma.rotation.y += dt * 0.35;
    this.plasma.rotation.x += dt * 0.12;
    const plasmaMat = this.plasma.material as THREE.MeshBasicMaterial;
    plasmaMat.opacity = 0.06 + gate(floatStage, 0, 1.05) * 0.28;
    this.plasma.scale.setScalar(1 + Math.sin(this.elapsed * 1.4) * 0.06);

    const cmbMat = this.cmb.material as THREE.MeshBasicMaterial;
    cmbMat.opacity = gate(floatStage, 2, 1.15) * 0.22;

    const ringAlpha = gate(floatStage, 2, 0.95);
    for (const ring of this.rings) {
      const mat = ring.material as THREE.LineBasicMaterial;
      mat.opacity = ringAlpha * 0.55;
      ring.visible = ringAlpha > 0.04;
      ring.rotation.y += dt * 0.25;
    }

    const sunAlpha = Math.max(gate(floatStage, 6, 1.15), gate(floatStage, 7, 1.05));
    this.sun.visible = sunAlpha > 0.05;
    this.sunGlow.visible = this.sun.visible;
    const sunMat = this.sun.material as THREE.MeshBasicMaterial;
    sunMat.opacity = 1;
    this.sun.scale.setScalar(index >= 7 ? 0.72 : 1);
    this.sunGlow.scale.setScalar((index >= 7 ? 5.2 : 7.4) * (0.85 + sunAlpha * 0.2));
    const glowMat = this.sunGlow.material;
    glowMat.opacity = 0.55 + sunAlpha * 0.35;

    const planetAlpha = gate(floatStage, 7, 0.9);
    this.planets.visible = planetAlpha > 0.05;
    for (let p = 0; p < this.planetMeshes.length; p += 1) {
      const spec = PLANETS[p];
      const mesh = this.planetMeshes[p];
      if (!spec || !mesh) continue;
      const angle = this.elapsed * spec.speed + p * 0.7;
      const formed = Math.min(1, Math.max(0, (cursor.local + (index === 7 ? 0 : -1) + p * 0.08) * 1.1));
      const orbit = spec.orbit * (1.15 - formed * 0.15);
      mesh.position.set(Math.cos(angle) * orbit, Math.sin(angle * 0.3) * spec.tilt, Math.sin(angle) * orbit);
      mesh.scale.setScalar(0.35 + formed * 0.65);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = planetAlpha;
      mat.transparent = true;
    }

    this.sparkPoints.rotation.y = floatStage >= 5 && floatStage < 6.35 ? this.elapsed * 0.045 : this.elapsed * 0.01;
    this.cloudPoints.rotation.y = this.elapsed * 0.018;
    this.starfield.rotation.y = this.elapsed * 0.004;
    const starMat = this.starfield.material;
    if (starMat instanceof THREE.PointsMaterial) {
      starMat.opacity = 0.18 + gate(floatStage, 5, 3) * 0.45;
    }

    const camA = CAM[index] ?? CAM[0];
    const camB = CAM[next] ?? camA;
    if (camA && camB) {
      this.camPos.lerpVectors(camA.pos, camB.pos, local);
      this.camLook.lerpVectors(camA.look, camB.look, local);
    }
    const orbit = this.elapsed * 0.08;
    const orbitAmt = 0.35 + gate(floatStage, 5, 1) * 0.4;
    this.camera.position.set(
      this.camPos.x * Math.cos(orbit) + this.camPos.z * Math.sin(orbit) * orbitAmt * 0.15,
      this.camPos.y,
      this.camPos.z * Math.cos(orbit) - this.camPos.x * Math.sin(orbit) * orbitAmt * 0.15,
    );
    this.camera.lookAt(this.camLook);

    const bgA = BG[index] ?? BG[0];
    const bgB = BG[next] ?? bgA;
    if (bgA && bgB) {
      this.bg.copy(bgA).lerp(bgB, local);
      this.scene.background = this.bg;
      const fog = this.scene.fog;
      if (fog instanceof THREE.FogExp2) {
        fog.color.copy(this.bg);
        fog.density = 0.008 + gate(floatStage, 0, 1) * 0.01;
      }
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.glow.dispose();
    this.sparkGeo.dispose();
    this.cloudGeo.dispose();
    this.sparkMat.dispose();
    this.cloudMat.dispose();
  }

  private makeStarfield(count: number): THREE.Points {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 55 + Math.random() * 50;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = 0.55 + Math.random() * 0.45;
      col[i * 3] = c;
      col[i * 3 + 1] = c * (0.9 + Math.random() * 0.1);
      col[i * 3 + 2] = c * (0.85 + Math.random() * 0.2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  private makeRings(): THREE.Line[] {
    const rings: THREE.Line[] = [];
    for (let i = 0; i < 4; i += 1) {
      const curve = new THREE.EllipseCurve(0, 0, 0.7 + i * 0.22, 0.42 + i * 0.1, 0, Math.PI * 2, false, 0);
      const pts = curve.getPoints(96).map((p) => new THREE.Vector3(p.x, p.y * 0.2, p.y));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0xc9d6ff,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(geo, mat);
      line.position.set((i - 1.5) * 2.4, (i % 2) * 0.8, (i - 1) * 1.6);
      rings.push(line);
    }
    return rings;
  }
}

