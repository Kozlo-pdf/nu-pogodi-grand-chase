import * as THREE from 'three';
export { THREE };

/* ---------- input ---------- */
export const input = { down: {}, hit: {} };
const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', (e) => {
  if (PREVENT.has(e.code)) e.preventDefault();
  if (!e.repeat) input.hit[e.code] = true;
  input.down[e.code] = true;
});
addEventListener('keyup', (e) => { input.down[e.code] = false; });
addEventListener('blur', () => { input.down = {}; });
export const isDown = (...c) => c.some((k) => input.down[k]);
export const wasHit = (...c) => c.some((k) => input.hit[k]);
export const endFrame = () => { input.hit = {}; };

// on-screen touch buttons (data-key = KeyboardEvent.code)
export function bindTouch() {
  document.querySelectorAll('[data-key]').forEach((b) => {
    const k = b.dataset.key;
    const on = (e) => { e.preventDefault(); input.down[k] = true; input.hit[k] = true; b.classList.add('on'); };
    const off = (e) => { e.preventDefault(); input.down[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
  });
}

/* ---------- maths ---------- */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}
export const damp = (k, dt) => 1 - Math.exp(-k * dt);

/* ---------- mesh helpers ---------- */
const matCache = new Map();
export function mat(color, emissive = 0, extra = {}) {
  const key = color + '|' + emissive + '|' + JSON.stringify(extra);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color, emissive, roughness: 0.8, metalness: 0.02, flatShading: true, ...extra,
    }));
  }
  return matCache.get(key);
}
export function mesh(geo, color, cast = true) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? mat(color) : color);
  m.castShadow = cast; m.receiveShadow = true;
  return m;
}
export const box = (w, h, d, c) => mesh(new THREE.BoxGeometry(w, h, d), c);
export const cyl = (rt, rb, h, c, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c);
export const sph = (r, c, seg = 14) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1)), c);
export const cone = (r, h, c, seg = 12) => mesh(new THREE.ConeGeometry(r, h, seg), c);
export const noShadow = (o) => { o.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return o; };

export function addLights(scene, o = {}) {
  const { sky = 0xcfe8ff, ground = 0x8a7a66, sun = 0xfff1d0, intensity = 1.15, hemi = 0.95 } = o;
  scene.add(new THREE.HemisphereLight(sky, ground, hemi));
  const d = new THREE.DirectionalLight(sun, intensity);
  d.castShadow = true;
  d.shadow.mapSize.set(1024, 1024);
  const c = d.shadow.camera;
  c.left = -24; c.right = 24; c.top = 24; c.bottom = -24; c.near = 1; c.far = 90;
  d.shadow.bias = -0.0006;
  scene.add(d, d.target);
  d.userData.off = new THREE.Vector3(14, 30, 16);
  return d;
}
export function followSun(d, p) {
  d.target.position.copy(p);
  d.position.copy(p).add(d.userData.off);
}

/* ---------- characters (all face +z locally, feet at y=0) ---------- */
function limb(len, r, color, y, x) {
  const g = new THREE.Group();
  const m = mesh(new THREE.CapsuleGeometry(r, len, 4, 8), color);
  m.position.y = -len / 2 - r * 0.3;
  g.add(m); g.position.set(x, y, 0);
  return g;
}

export function makeHare(p = {}) {
  const { fur = 0x9fa8b5, white = 0xf3f3f7, shirt = 0xe9772e, pants = 0x3a4a6b, pupil = 0x111111 } = p;
  const g = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(0.3, 0.45, 4, 10), shirt);
  torso.position.y = 1.0; g.add(torso);
  const head = sph(0.33, fur); head.position.set(0, 1.66, 0.02); g.add(head);
  const snout = sph(0.17, white); snout.position.set(0, 1.58, 0.27); g.add(snout);
  const nose = sph(0.05, 0xff6f91, 8); nose.position.set(0, 1.63, 0.43); g.add(nose);
  for (const s of [-1, 1]) {
    const eye = sph(0.09, 0xffffff, 10); eye.position.set(s * 0.14, 1.75, 0.25); g.add(eye);
    const pu = sph(0.045, pupil, 8); pu.position.set(s * 0.14, 1.75, 0.33); g.add(pu);
    const ear = mesh(new THREE.CapsuleGeometry(0.08, 0.55, 4, 8), fur);
    ear.position.set(s * 0.17, 2.25, -0.02); ear.rotation.z = -s * 0.22; g.add(ear);
    const inner = mesh(new THREE.CapsuleGeometry(0.035, 0.4, 4, 6), 0xffb3c7);
    inner.position.set(s * 0.17, 2.25, 0.05); inner.rotation.z = -s * 0.22; g.add(inner);
  }
  const tail = sph(0.15, white, 10); tail.position.set(0, 0.8, -0.34); g.add(tail);
  const legL = limb(0.35, 0.11, pants, 0.78, -0.15), legR = limb(0.35, 0.11, pants, 0.78, 0.15);
  const armL = limb(0.38, 0.08, fur, 1.3, -0.38), armR = limb(0.38, 0.08, fur, 1.3, 0.38);
  g.add(legL, legR, armL, armR);
  g.userData = { legL, legR, armL, armR };
  return g;
}

export function makeRobotHare() {
  const g = makeHare({ fur: 0x8f9ba8, white: 0xc9d2da, shirt: 0x5c6670, pants: 0x444c55, pupil: 0xff2a2a });
  const gl = sph(0.1, mat(0xff2a2a, 0xaa0000), 8); gl.position.set(0, 1.8, 0.3); g.add(gl);
  return g;
}

export function makeWolf({ dress = false, scale = 1 } = {}) {
  const fur = 0x5a647c, shirt = dress ? 0x7ec8ff : 0x2e78c7, pants = 0x8a3b2b;
  const g = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(0.36, 0.5, 4, 10), shirt);
  torso.position.y = 1.08; g.add(torso);
  const head = sph(0.37, fur); head.position.set(0, 1.8, 0.02); g.add(head);
  const snout = cone(0.2, 0.55, 0x7a859c, 10); snout.rotation.x = Math.PI / 2; snout.position.set(0, 1.7, 0.45); g.add(snout);
  const nose = sph(0.06, 0x111111, 8); nose.position.set(0, 1.72, 0.74); g.add(nose);
  for (const s of [-1, 1]) {
    const eye = sph(0.09, 0xffe36b, 10); eye.position.set(s * 0.15, 1.88, 0.27); g.add(eye);
    const pu = sph(0.04, 0x111111, 8); pu.position.set(s * 0.15, 1.88, 0.35); g.add(pu);
    const ear = cone(0.12, 0.4, fur, 8); ear.position.set(s * 0.22, 2.28, -0.02); ear.rotation.z = -s * 0.25; g.add(ear);
  }
  const tail = cone(0.14, 0.7, fur, 8); tail.rotation.x = -2.1; tail.position.set(0, 0.8, -0.5); g.add(tail);
  const legL = limb(0.38, 0.13, dress ? fur : pants, 0.8, -0.17), legR = limb(0.38, 0.13, dress ? fur : pants, 0.8, 0.17);
  const armL = limb(0.4, 0.1, fur, 1.38, -0.46), armR = limb(0.4, 0.1, fur, 1.38, 0.46);
  g.add(legL, legR, armL, armR);
  if (dress) {
    const skirt = cone(0.62, 0.85, 0x7ec8ff, 14); skirt.position.y = 0.85; g.add(skirt);
    const trim = cyl(0.63, 0.63, 0.1, 0xffffff, 14); trim.position.y = 0.45; g.add(trim);
    const hat = cyl(0.3, 0.36, 0.38, 0xe23a3a, 12); hat.position.set(0, 2.38, 0); g.add(hat);
    for (const s of [-1, 1]) {
      const braid = mesh(new THREE.CapsuleGeometry(0.07, 0.9, 4, 6), 0xd9b26f);
      braid.position.set(s * 0.3, 1.7, -0.1); g.add(braid);
    }
  }
  g.userData = { legL, legR, armL, armR };
  g.scale.setScalar(scale);
  return g;
}

export function animateLimbs(g, phase, amp = 0.9, air = false) {
  const u = g.userData;
  if (!u.legL) return;
  if (air) {
    u.legL.rotation.x = -0.7; u.legR.rotation.x = 0.5;
    u.armL.rotation.x = -2.5; u.armR.rotation.x = -2.5;
  } else {
    const s = Math.sin(phase) * amp;
    u.legL.rotation.x = s; u.legR.rotation.x = -s;
    u.armL.rotation.x = -s; u.armR.rotation.x = s;
  }
}

/* ---------- misc props ---------- */
export function makeWheel(r, color = 0x222222) {
  const g = new THREE.Group();
  const t = mesh(new THREE.TorusGeometry(r, r * 0.16, 8, 20), color); t.rotation.y = Math.PI / 2;
  const s = box(0.05, r * 1.9, 0.05, 0xaaaaaa);
  g.add(t, s);
  g.position.y = r;
  return g;
}

export function disposeScene(scene) {
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
