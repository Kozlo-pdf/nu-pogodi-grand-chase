import * as THREE from 'three';
export { THREE };

/* ---------- input ---------- */
export const input = { down: {}, hit: {}, splitPads: false };
const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
addEventListener('keydown', (e) => {
  if (PREVENT.has(e.code)) e.preventDefault();
  if (!e.repeat) input.hit[e.code] = true;
  input.down[e.code] = true;
});
addEventListener('keyup', (e) => { input.down[e.code] = false; });
addEventListener('blur', () => { input.down = {}; });
export const isDown = (...c) => c.some((k) => input.down[k] || gp.down[k]);
export const wasHit = (...c) => c.some((k) => input.hit[k] || gp.hit[k]);
export const endFrame = () => { input.hit = {}; gp.hit = {}; };
/* ---------- gamepad (PS4 DualShock 4 / any "standard" controller) ---------- */
const gp = { down: {}, hit: {} };
const padProfile = { square: 'KeyE', camRight: 'KeyZ', help: '' };
export const setPadProfile = (p) => Object.assign(padProfile, p);
export const padHelp = () => padProfile.help;
export function pollGamepad() {
  const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter((p) => p && p.connected);
  const now = {};
  const set = (codes, v) => { if (v) codes.forEach((c) => { now[c] = true; }); };
  pads.forEach((p, idx) => {
    const split = input.splitPads && pads.length >= 2;
    const dz = (i) => (Math.abs(p.axes[i] || 0) > 0.35 ? p.axes[i] : 0);
    const b = (i) => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5));
    const lx = dz(0), ly = dz(1), rx = dz(2);
    const left = lx < 0 || b(14), right = lx > 0 || b(15), up = ly < 0 || b(12), down = ly > 0 || b(13);
    if (!split || idx === 0) { set(['KeyA'], left); set(['KeyD'], right); set(['KeyW'], up); set(['KeyS'], down); }
    if (!split || idx === 1) { set(['ArrowLeft'], left); set(['ArrowRight'], right); set(['ArrowUp'], up); set(['ArrowDown'], down); }
    if (split && idx > 0) return;
    set(['PadUp'], up); set(['PadDown'], down);
    set(['Space', 'Enter', 'PadA'], b(0));      // cross: jump / confirm
    set([padProfile.square], b(2));             // square: interact
    set(['Tab'], b(3));                         // triangle: swap characters
    set(['KeyF'], b(1));                        // circle: grapple
    set(['KeyC'], b(5));                        // R1: disguise
    set(['ShiftLeft'], b(4));                   // L1: sneak
    set(['KeyQ'], rx < 0 || b(6));              // L2 / right stick: camera
    set([padProfile.camRight], rx > 0 || b(7));
    set(['Escape'], b(9)); set(['KeyR'], b(8)); set(['KeyM'], b(10)); // options / share / L3
  });
  for (const k of Object.keys(now)) if (!gp.down[k]) gp.hit[k] = true;
  gp.down = now;
}


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
// Limb group pivoting at its top. Optional hand/foot, and a flared (bell-bottom) leg.
function limb(len, r, color, y, x, o = {}) {
  const g = new THREE.Group();
  if (o.flare) {
    const m = mesh(new THREE.CylinderGeometry(r, r * o.flare, len + r, 10), color);
    m.position.y = -(len + r) / 2; g.add(m);
  } else {
    const m = mesh(new THREE.CapsuleGeometry(r, len, 4, 10), color);
    m.position.y = -len / 2 - r * 0.3; g.add(m);
  }
  const bottom = -(len + r * 1.2);
  if (o.hand) { const h = sph(o.handR ?? r * 1.25, o.hand, 10); h.position.y = bottom - 0.02; g.add(h); }
  if (o.foot) {
    const f = sph(o.footR ?? r * 1.35, o.foot, 10); f.scale.set(1, 0.6, 1.6); f.position.set(0, bottom + 0.02, 0.08); g.add(f);
  }
  g.position.set(x, y, 0);
  return g;
}

export function makeHare(p = {}) {
  const { fur = 0x9fa8b5, white = 0xf3f3f7, shirt = 0xe9772e, pants = 0x3a4a6b, pupil = 0x111111 } = p;
  const g = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(0.31, 0.42, 6, 12), shirt); torso.position.y = 1.0; g.add(torso);
  const collar = mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 14), white); collar.rotation.x = Math.PI / 2; collar.position.y = 1.34; g.add(collar);
  for (let i = 0; i < 3; i++) { const b = sph(0.035, 0xffffff, 6); b.position.set(0, 1.2 - i * 0.16, 0.3); g.add(b); }
  const belt = cyl(0.32, 0.32, 0.07, 0x3a2a1a, 14); belt.position.y = 0.76; g.add(belt);

  const head = new THREE.Group(); head.position.set(0, 1.66, 0.02); g.add(head);
  const skull = sph(0.34, fur, 16); skull.scale.set(1.05, 0.96, 1); head.add(skull);
  for (const s of [-1, 1]) {
    const cheek = sph(0.15, white, 10); cheek.position.set(s * 0.15, -0.1, 0.22); head.add(cheek);
    const eye = sph(0.1, 0xffffff, 12); eye.position.set(s * 0.14, 0.1, 0.25); head.add(eye);
    const pu = sph(0.052, pupil, 8); pu.position.set(s * 0.14, 0.1, 0.34); head.add(pu);
    const glint = sph(0.02, 0xffffff, 5); glint.position.set(s * 0.14 + 0.02, 0.13, 0.385); head.add(glint);
    const brow = box(0.14, 0.03, 0.03, 0x555d69); brow.position.set(s * 0.14, 0.23, 0.28); brow.rotation.z = -s * 0.25; head.add(brow);
    for (let k = -1; k <= 1; k++) {
      const w = cyl(0.008, 0.008, 0.32, 0x333333, 4); w.rotation.z = Math.PI / 2 + k * 0.18 * s; w.position.set(s * 0.3, -0.1 + k * 0.045, 0.36); head.add(w);
    }
    const ear = mesh(new THREE.CapsuleGeometry(0.085, 0.58, 4, 10), fur); ear.position.set(s * 0.17, 0.62, -0.02); ear.rotation.z = -s * 0.2; ear.rotation.x = -0.08; head.add(ear);
    const inner = mesh(new THREE.CapsuleGeometry(0.04, 0.42, 4, 8), 0xffb3c7); inner.position.set(s * 0.17, 0.62, 0.05); inner.rotation.z = -s * 0.2; inner.rotation.x = -0.08; head.add(inner);
  }
  const muzzle = sph(0.17, white, 12); muzzle.position.set(0, -0.08, 0.28); head.add(muzzle);
  const nose = sph(0.055, 0xff6f91, 8); nose.position.set(0, -0.02, 0.44); head.add(nose);
  const mouth = box(0.1, 0.02, 0.03, 0x663344); mouth.position.set(0, -0.16, 0.43); head.add(mouth);
  for (const s of [-1, 1]) { const t = box(0.045, 0.07, 0.03, 0xffffff); t.position.set(s * 0.028, -0.2, 0.42); head.add(t); }

  const tail = sph(0.16, white, 12); tail.position.set(0, 0.82, -0.34); g.add(tail);
  const tail2 = sph(0.09, white, 8); tail2.position.set(0, 0.92, -0.42); g.add(tail2);
  const legL = limb(0.6, 0.1, pants, 0.78, -0.15, { foot: 0x5a3a28 }), legR = limb(0.6, 0.1, pants, 0.78, 0.15, { foot: 0x5a3a28 });
  const armL = limb(0.38, 0.075, fur, 1.28, -0.38, { hand: white }), armR = limb(0.38, 0.075, fur, 1.28, 0.38, { hand: white });
  g.add(legL, legR, armL, armR);
  g.userData = { legL, legR, armL, armR, head };
  return g;
}

export function makeRobotHare() {
  const g = makeHare({ fur: 0x8f9ba8, white: 0xc9d2da, shirt: 0x5c6670, pants: 0x444c55, pupil: 0xff2a2a });
  const gl = sph(0.1, mat(0xff2a2a, 0xaa0000), 8); gl.position.set(0, 1.8, 0.3); g.add(gl);
  const ant = cyl(0.015, 0.015, 0.4, 0x333333, 4); ant.position.set(0.1, 2.5, 0); g.add(ant);
  const bulb = sph(0.05, mat(0xff2a2a, 0xff0000), 6); bulb.position.set(0.1, 2.72, 0); g.add(bulb);
  for (const s of [-1, 1]) { const bolt = sph(0.045, 0x222222, 6); bolt.position.set(s * 0.33, 1.66, 0.02); g.add(bolt); }
  return g;
}

export function makeWolf({ dress = false, scale = 1 } = {}) {
  const fur = 0x5a647c, furLight = 0x7a859c, shirt = dress ? 0x7ec8ff : 0xf08aa8, pants = 0x8a3b2b;
  const g = new THREE.Group();
  const torso = mesh(new THREE.CapsuleGeometry(0.37, 0.46, 6, 12), shirt); torso.position.y = 1.06; g.add(torso);
  if (!dress) {
    const col = box(0.5, 0.06, 0.2, 0xffd1de); col.position.set(0, 1.5, 0.28); g.add(col);
    for (const s of [-1, 1]) { const c = cone(0.14, 0.3, 0xffd1de, 4); c.position.set(s * 0.18, 1.45, 0.3); c.rotation.z = -s * 1.2; g.add(c); }
    const belt = cyl(0.38, 0.38, 0.08, 0x2a1a12, 14); belt.position.y = 0.76; g.add(belt);
    const chest = sph(0.2, furLight, 8); chest.position.set(0, 1.42, 0.3); chest.scale.set(1, 0.8, 0.5); g.add(chest);
  }

  const head = new THREE.Group(); head.position.set(0, 1.8, 0.02); g.add(head);
  const skull = sph(0.38, fur, 16); skull.scale.set(1.03, 0.97, 1); head.add(skull);
  const snout = cone(0.21, 0.6, furLight, 12); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.1, 0.45); head.add(snout);
  const nose = sph(0.065, 0x111111, 8); nose.position.set(0, -0.04, 0.76); head.add(nose);
  const jaw = box(0.3, 0.07, 0.4, 0x4a5368); jaw.position.set(0, -0.2, 0.42); head.add(jaw);
  for (const s of [-1, 1]) {
    const fang = cone(0.03, 0.1, 0xffffff, 4); fang.rotation.x = Math.PI; fang.position.set(s * 0.1, -0.2, 0.55); head.add(fang);
    const eye = sph(0.1, 0xffe36b, 12); eye.position.set(s * 0.16, 0.1, 0.28); head.add(eye);
    const pu = sph(0.045, 0x111111, 8); pu.position.set(s * 0.16, 0.1, 0.37); head.add(pu);
    const brow = box(0.2, 0.05, 0.06, 0x2a3040); brow.position.set(s * 0.16, 0.22, 0.3); brow.rotation.z = s * 0.35; head.add(brow);
    const ear = cone(0.13, 0.46, fur, 8); ear.position.set(s * 0.24, 0.45, -0.02); ear.rotation.z = -s * 0.25; head.add(ear);
    const earIn = cone(0.07, 0.3, 0xffb3c7, 6); earIn.position.set(s * 0.24, 0.43, 0.03); earIn.rotation.z = -s * 0.25; head.add(earIn);
    const tuft = cone(0.09, 0.22, furLight, 5); tuft.position.set(s * 0.36, -0.05, 0.05); tuft.rotation.z = -s * 1.4; head.add(tuft);
  }
  for (let i = -1; i <= 1; i++) { const h = cone(0.08, 0.28, 0x3a4256, 5); h.position.set(i * 0.12, 0.36, 0.1); h.rotation.x = -0.5; head.add(h); }
  if (!dress) { // the famous cigarette
    const cig = cyl(0.022, 0.022, 0.34, 0xffffff, 6); cig.rotation.x = Math.PI / 2; cig.rotation.z = 0.15; cig.position.set(0.1, -0.2, 0.62); head.add(cig);
    const tip = sph(0.03, mat(0xff7a1a, 0xff4400), 6); tip.position.set(0.13, -0.2, 0.79); head.add(tip);
  }

  const tail = cone(0.16, 0.8, fur, 10); tail.rotation.x = -2.1; tail.position.set(0, 0.78, -0.52); g.add(tail);
  const legL = limb(0.62, 0.13, dress ? fur : pants, 0.82, -0.18, { flare: dress ? undefined : 1.7, foot: 0x2a1a12 });
  const legR = limb(0.62, 0.13, dress ? fur : pants, 0.82, 0.18, { flare: dress ? undefined : 1.7, foot: 0x2a1a12 });
  const armL = limb(0.4, 0.1, dress ? fur : shirt, 1.36, -0.47, { hand: fur, handR: 0.14 }), armR = limb(0.4, 0.1, dress ? fur : shirt, 1.36, 0.47, { hand: fur, handR: 0.14 });
  g.add(legL, legR, armL, armR);
  if (dress) {
    const skirt = cone(0.64, 0.86, 0x7ec8ff, 16); skirt.position.y = 0.88; g.add(skirt);
    const trim = cyl(0.65, 0.65, 0.1, 0xffffff, 16); trim.position.y = 0.46; g.add(trim);
    const hat = cyl(0.3, 0.37, 0.38, 0xe23a3a, 12); hat.position.set(0, 2.4, 0); g.add(hat);
    const gem = sph(0.06, mat(0xffd23f, 0x886600), 6); gem.position.set(0, 2.4, 0.36); g.add(gem);
    for (const s of [-1, 1]) {
      const braid = mesh(new THREE.CapsuleGeometry(0.07, 0.9, 4, 6), 0xd9b26f);
      braid.position.set(s * 0.3, 1.7, -0.1); g.add(braid);
    }
  }
  g.userData = { legL, legR, armL, armR, head };
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
  const tire = mesh(new THREE.TorusGeometry(r * 0.82, r * 0.22, 8, 22), color); tire.rotation.y = Math.PI / 2; g.add(tire);
  const rim = cyl(r * 0.72, r * 0.72, r * 0.3, 0x9aa0aa, 18); rim.rotation.z = Math.PI / 2; g.add(rim);
  const hub = cyl(r * 0.28, r * 0.28, r * 0.42, 0xd8dce4, 10); hub.rotation.z = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 4; i++) { const sp = box(r * 0.34, r * 1.3, r * 0.1, 0x6a707a); sp.rotation.x = i * Math.PI / 4; g.add(sp); }
  g.position.y = r;
  return g;
}

export function disposeScene(scene) {
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
