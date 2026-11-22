import { THREE, box, cyl, sph, cone, mat, mesh } from './common.js';
import { Platformer } from './platformer.js';
import { Arena } from './arena.js';
import { Runner } from './runner.js';

const rows = (list, base = {}) => list.map(([x, y, w, d = 4, extra = {}]) => ({ x, y, w, d, ...base, ...extra }));
const pend = (x, top, o = {}) => ({
  type: 'pendulum', pivot: [x, top + 6.5, 0], len: 5.2, amp: 0.85, speed: 2, axis: 'x', r: 0.8, color: 0x3a3a42, ...o,
});
const slider = (x, y, z0, z1, o = {}) => ({ type: 'slider', from: [x, y, z0], to: [x, y, z1], speed: 1.5, r: 0.6, ...o });

/* ============ Circus big top ============ */
export function circus(ctx) {
  const list = rows([
    [0, 0, 8, 5, { cp: true }], [9, 0.4, 3, 3, { crumble: true }], [14, 1.2, 3, 3, { crumble: true }],
    [22, 2.0, 9, 1.4], [30, 2.8, 3, 3, { move: { axis: 'x', range: 1.5, speed: 1.5 } }], [36.5, 3.6, 5, 4, { cp: true }],
    [43, 4.4, 2.6, 2.6], [49, 5.2, 2.6, 2.6, { crumble: true }], [55, 6.0, 2.6, 2.6], [61, 6.8, 2.6, 2.6, { move: { axis: 'y', range: 1, speed: 1.4 } }],
    [67.5, 7.4, 5, 4, { cp: true }], [74.5, 8.2, 3, 3], [80.5, 9.0, 3, 3, { crumble: true }], [86.5, 9.8, 3, 3],
    [93, 10.6, 4, 4, { cp: true }], [100, 11.4, 3, 3, { move: { axis: 'x', range: 2, speed: 1.3 } }], [107.5, 12.2, 10, 6],
  ], { color: 0xd9363e });
  return new Platformer(ctx, {
    sky: 0x2b1b4a, fog: 0x2b1b4a, platforms: list, spawn: [0, 0.1, 0], killY: -12, moverColor: 0xffc933, crumbleColor: 0xf0e6c8,
    light: { sky: 0xffd9f0, ground: 0x553355, sun: 0xfff0d0, intensity: 1.0 },
    hazards: [pend(43, 4.4, { axis: 'z', phase: 0.5 }), pend(55, 6.0, { axis: 'z', phase: 2 }), pend(74.5, 8.2, { speed: 2.2 }), pend(93, 10.6, { axis: 'z', phase: 1 })],
    goal: { pos: [110, 12.2, 0], need: 0 }, hitMsg: 'The Wolf swung the trapeze right at you!',
    build(scene) {
      const floor = cyl(70, 70, 1, 0x5a2a3a, 40); floor.position.set(55, -30, 0); scene.add(floor);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const p = cyl(0.5, 0.5, 90, i % 2 ? 0xf5f1e6 : 0xd9363e, 8); p.position.set(55 + Math.cos(a) * 62, 15, Math.sin(a) * 62 - 6); scene.add(p);
      }
      const top = cone(70, 24, 0xd9363e, 12); top.position.set(55, 62, -4); scene.add(top);
      for (let i = 0; i < 18; i++) {
        const b = sph(0.45, mat(0xfff0a0, 0xaa8800), 8); b.position.set(i * 7 - 8, 14 + (i % 3), -10); scene.add(b);
      }
      for (let i = 0; i < 5; i++) { const s = cone(1.6, 6, 0xffd23f, 6); s.position.set(20 + i * 20, -2, -8); scene.add(s); }
      const ring = cyl(6, 6, 0.4, 0xffc933, 24); ring.position.set(108, 11.8, -12); scene.add(ring);
    },
  });
}

/* ============ Beach boardwalk ============ */
export function beach(ctx) {
  const list = [
    ...rows([
      [0, 0, 9, 5, { cp: true }], [10.5, 0, 3, 3], [16, 0.8, 3, 3, { move: { axis: 'x', range: 2, speed: 1.2 } }],
      [23, 0.8, 6, 4, { cp: true }], [37, 4.6, 4, 4, { cp: true }], [44, 4.6, 3, 3, { crumble: true }], [50, 5.4, 3, 3],
      [56, 6.2, 3, 3, { move: { axis: 'y', range: 1.2, speed: 1.3 } }], [63, 6.2, 6, 4, { cp: true }], [70, 7, 3, 3],
      [76, 7.8, 3, 3, { move: { axis: 'x', range: 2, speed: 1.2 } }], [90, 11.8, 5, 4, { cp: true }], [97, 12.6, 3, 3, { crumble: true }],
      [103, 13.4, 3, 3], [110.5, 14, 8, 6],
    ], { color: 0xb8864b }),
    { x: 30.5, y: 1.6, z: 0, w: 2.6, d: 2.6, h: 0.5, bounce: 16 },
    { x: 83, y: 8.4, z: 0, w: 2.6, d: 2.6, h: 0.5, bounce: 17 },
  ];
  return new Platformer(ctx, {
    sky: 0x8fd8ff, platforms: list, spawn: [0, 0.1, 0], killY: -6, moverColor: 0xf2f2f2,
    light: { sky: 0xe6f6ff, ground: 0xe0c98a, sun: 0xfff6d0, intensity: 1.3 },
    hazards: [slider(0, 1.4, 0, 0, { from: [21, 1.4, 0], to: [25, 1.4, 0], r: 0.5, speed: 2.2, color: 0xe85a2a }),
      slider(0, 6.8, 0, 0, { from: [60.5, 6.8, 0], to: [65.5, 6.8, 0], r: 0.5, speed: 2.2, color: 0xe85a2a }),
      pend(37, 4.6, { axis: 'z', phase: 1 }), pend(90, 11.8, { axis: 'z', phase: 0.3 })],
    goal: { pos: [112, 14, 0], need: 0 }, hitMsg: 'Snap! Back to the last checkpoint!',
    build(scene) {
      const water = box(600, 1, 300, mat(0x2a9fd8, 0x0a3a55, { transparent: true, opacity: 0.85 })); water.position.set(50, -4, 0); water.castShadow = false; scene.add(water);
      const sand = box(80, 1, 40, 0xf0dca0); sand.position.set(-30, -0.5, 0); scene.add(sand);
      for (let i = 0; i < 12; i++) {
        const t = cyl(0.3, 0.4, 7, 0x8a5a2a, 6); t.position.set(i * 11 - 4, -1, -8 - (i % 3) * 3); t.rotation.z = 0.15; scene.add(t);
        for (let k = 0; k < 5; k++) { const l = box(4, 0.2, 0.8, 0x2f9e4a); l.position.set(i * 11 - 3, 2.8, -8 - (i % 3) * 3); l.rotation.y = k * 1.26; scene.add(l); }
      }
      for (const pl of list) { if (pl.bounce) { const um = cone(2.2, 1.2, 0xff5f8a, 8); um.position.set(pl.x, pl.y + 1.6, pl.z); scene.add(um); } }
      const sun = sph(7, mat(0xfff08a, 0xffee66), 16); sun.position.set(100, 40, -90); sun.castShadow = false; scene.add(sun);
      for (let i = 0; i < 8; i++) { const piles = cyl(0.25, 0.25, 6, 0x5b3d22, 6); piles.position.set(i * 14, -2, 3); scene.add(piles); }
    },
  });
}

/* ============ Snowy village (icy!) ============ */
export function village(ctx) {
  const list = rows([
    [0, 0, 10, 6, { cp: true }], [11.5, 0, 4, 4], [18, 0.5, 4, 4, { crumble: true }], [24.5, 1.0, 4, 4], [31, 1.5, 5, 4, { cp: true }],
    [38, 2.2, 3.6, 3.6, { move: { axis: 'x', range: 2, speed: 1.2 } }], [45.5, 2.8, 4, 4], [52, 3.4, 4, 4, { crumble: true }],
    [58.5, 4.0, 5, 4, { cp: true }], [65.5, 4.6, 3.6, 3.6, { move: { axis: 'y', range: 1.2, speed: 1.3 } }], [72, 5.2, 4, 4],
    [78.5, 5.8, 4, 4], [85, 6.4, 6, 4, { cp: true }], [92, 7.0, 4, 4, { crumble: true }], [98.5, 7.6, 4, 4], [105, 8.2, 10, 6],
  ], { color: 0xcfeaff });
  return new Platformer(ctx, {
    sky: 0xb8d8f0, platforms: list, spawn: [0, 0.1, 0], killY: -12, ice: true, moverColor: 0x7fc4ff, crumbleColor: 0x9fd0f0,
    light: { sky: 0xe8f4ff, ground: 0x9fb4cc, sun: 0xfff4e0, intensity: 1.1, hemi: 1.3 },
    hazards: [slider(0, 1.6, 0, 0, { from: [24.5, 1.6, -4], to: [24.5, 1.6, 4], r: 0.7, speed: 1.6, color: 0xffffff }),
      slider(0, 3.4, 0, 0, { from: [45.5, 3.4, 4], to: [45.5, 3.4, -4], r: 0.7, speed: 1.9, color: 0xffffff }),
      slider(0, 5.8, 0, 0, { from: [72, 5.8, -4], to: [72, 5.8, 4], r: 0.7, speed: 2.0, color: 0xffffff }),
      slider(0, 8.2, 0, 0, { from: [98.5, 8.2, 4], to: [98.5, 8.2, -4], r: 0.7, speed: 2.2, color: 0xffffff })],
    goal: { pos: [107, 8.2, 0], need: 0 }, hitMsg: 'Splat! A rolling snowball!',
    build(scene) {
      const snow = box(500, 1, 200, 0xf4f8ff); snow.position.set(55, -14, 0); scene.add(snow);
      for (let i = 0; i < 14; i++) {
        const h = box(7, 5, 6, [0xc98f6b, 0xb86b4a, 0xd9b27a][i % 3]); h.position.set(i * 10 - 5, -11, -14 - (i % 2) * 6); scene.add(h);
        const r = cone(5.5, 3, 0xffffff, 4); r.position.set(i * 10 - 5, -7, -14 - (i % 2) * 6); r.rotation.y = Math.PI / 4; scene.add(r);
      }
      for (let i = 0; i < 20; i++) {
        const t = new THREE.Group();
        const tr = cyl(0.3, 0.4, 1.4, 0x5b3a21, 6); tr.position.y = 0.7; t.add(tr);
        for (let k = 0; k < 3; k++) { const c = cone(1.6 - k * 0.4, 2.2, 0x2a8a46, 8); c.position.y = 2 + k * 1.3; t.add(c); }
        t.position.set(i * 6 - 6, -13, 8 + (i % 3) * 3); scene.add(t);
      }
      const stage = box(16, 3, 8, 0xb02a3a); stage.position.set(112, 6.6, -6); scene.add(stage);
    },
  });
}

/* ============ Metro runner ============ */
function metroObstacle(kind, rng, w) {
  const g = new THREE.Group();
  if (kind === 'low') {
    const b = box(w, 1.0, 0.8, 0x3a5a7a); b.position.y = 0.5; g.add(b);
    const s = box(w, 0.2, 0.82, 0xffc933); s.position.y = 0.85; g.add(s);
  } else if (kind === 'high') {
    for (const s of [-1, 1]) { const p = box(0.6, 3.4, 0.6, 0x555b66); p.position.set(s * (w / 2 + 0.2), 1.7, 0); g.add(p); }
    const bar = box(w + 0.8, 1.2, 0.6, 0x7a808c); bar.position.y = 1.95; g.add(bar);
    const st = box(w - 1, 0.14, 0.62, 0xffc933); st.position.y = 2.2; g.add(st);
  } else {
    const c = box(w - 0.4, 2.2, 3.6, 0x3a7bd5); c.position.y = 1.4; g.add(c);
    const win = box(w - 0.5, 0.7, 3.7, 0x9fdcff); win.position.y = 1.9; g.add(win);
    const st = box(w - 0.35, 0.25, 3.65, 0xffffff); st.position.y = 1.0; g.add(st);
  }
  return g;
}
function metroScenery(rng) {
  const g = new THREE.Group();
  if (rng() < 0.6) {
    const p = box(1.2, 10, 1.2, 0x8a8f99); p.position.y = 5; g.add(p);
    const t = box(1.3, 3, 1.3, 0xd8d2c4); t.position.y = 1.5; g.add(t);
  } else {
    const l = sph(0.5, mat(0xfff2b0, 0xffe680), 8); l.position.y = 8.5; g.add(l);
    const c = cyl(0.05, 0.05, 2, 0x333333, 4); c.position.y = 9.5; g.add(c);
  }
  return g;
}
export function metro(ctx) {
  return new Runner(ctx, {
    sky: 0x12141c, ground: 0x4a4e58, side: 0x2a2d35, line: 0xffc933, ceiling: 0x1c1f28, length: 1000, seed: 57,
    speed0: 14, speed1: 19, player: 'hare', hint: 'Run through the metro tunnel! A train is coming…',
    phases: [{ at: 0, kind: 'wolf' }, { at: 0.5, kind: 'train', msg: 'The Wolf hijacked a SUBWAY TRAIN!' }],
    makeObstacle: metroObstacle, scenery: metroScenery, sceneryStep: 11,
    light: { sky: 0xaab8ff, ground: 0x333344, sun: 0xfff0d0, intensity: 0.9, hemi: 1.1 },
    finishMsg: 'The train derailed into the tunnel wall!', caught: 'The Wolf caught you in the tunnel! Nu, zayats…',
  });
}

/* ============ Boss 2: the big top ============ */
export function bigTopBoss(ctx) {
  return new Arena(ctx, {
    need: 5, speed: 5.5, open: 4.8,
    colors: { stage: 0x2a4fa8, c1: 0xd9363e, c2: 0xf5f1e6 },
    levers: [[-9, 4], [9, 4], [-5, -9], [5, -9]],
  });
}
