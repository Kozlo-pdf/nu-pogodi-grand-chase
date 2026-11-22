import {
  THREE, box, cyl, sph, cone, mat, mesh,
} from './common.js';
import { Platformer } from './platformer.js';
import { Arena } from './arena.js';
import { Runner } from './runner.js';
import { Ship } from './ship.js';
import { Ending } from './ending.js';

const PLAT_CONTROLS = 'WASD / Arrows: move  •  Space: jump (press again in mid-air for a double jump)  •  Q / E: rotate camera  •  R: restart';
const RUN_CONTROLS = 'A / D: change lane  •  Space / W: jump  •  S: slide under bars (or slam down in mid-air)  •  R: restart';

/* ---------------- helpers for platformer data ---------------- */
// rows: [x, y, w, d?, extra?]  (top-centre)
const rows = (list, base = {}) => list.map(([x, y, w, d = 4, extra = {}]) => ({ x, y, w, d, ...base, ...extra }));

/* ================= PROLOGUE: balcony escape ================= */
function balcony(ctx) {
  const list = rows([
    [0, 0, 7, 4, { cp: true }], [8.5, 0.5, 4], [15, 1.2, 4], [21.5, 0.2, 4], [28.5, 1.4, 4],
    [35.5, 2.4, 3.4, 4, { move: { axis: 'y', range: 1.1, speed: 1.3 } }], [43, 2, 5, 4, { cp: true }],
    [50.5, 3, 4], [57, 3.2, 4], [64.5, 4, 5, 4, { cp: true }], [72, 4.6, 4],
    [78.5, 5.4, 4], [85, 6.2, 4, 4, { crumble: true }], [91.5, 7.0, 4, 4, { cp: true }], [98.5, 7.8, 3.4, 4, { move: { axis: 'y', range: 1, speed: 1.3 } }],
    [105.5, 8.4, 4], [112, 9.2, 4], [119, 9.8, 3.4, 4, { move: { axis: 'x', range: 2, speed: 1.3 } }], [126, 10.6, 5, 4, { cp: true }],
    [133.5, 11.4, 4], [140, 12.2, 4], [147, 13, 9, 4],
  ], { z: -1, color: 0xb4693a });
  const cfg = {
    sky: 0xa9dcff, platforms: list, spawn: [0, 0.1, -1], killY: -14,
    hazards: [
      { type: 'pendulum', pivot: [91.5, 13.6, -1], len: 5.6, amp: 0.9, speed: 2.1, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 0.8 },
      { type: 'pendulum', pivot: [112, 15.8, -1], len: 5.8, amp: 0.9, speed: 2.2, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 1.6 },
      { type: 'pendulum', pivot: [133.5, 18.0, -1], len: 5.8, amp: 0.9, speed: 2.3, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 2.9 },
      { type: 'pendulum', pivot: [21.5, 6.8, -1], len: 5.6, amp: 0.85, speed: 1.9, axis: 'x', r: 0.55, color: 0x4a4a52 },
      { type: 'pendulum', pivot: [50.5, 9.6, -1], len: 5.8, amp: 0.85, speed: 2.1, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 1 },
      { type: 'pendulum', pivot: [57, 9.8, -1], len: 5.6, amp: 0.9, speed: 2.0, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 2.2 },
      { type: 'pendulum', pivot: [72, 11.2, -1], len: 5.8, amp: 0.9, speed: 2.3, axis: 'x', r: 0.55, color: 0x4a4a52, phase: 0.5 },
    ],
    goal: { pos: [149, 13, -1], need: 0 },
    hitMsg: 'The Wolf\'s hook swatted you! Back to the last balcony!',
    build(scene) {
      const wall = box(230, 100, 0.6, 0xf3ead2); wall.position.set(100, 0, -3.4); scene.add(wall);
      for (let x = -4; x < 170; x += 7) for (let y = -30; y < 30; y += 6.5) {
        const w = box(2.2, 2.6, 0.3, 0x56789a); w.position.set(x, y + 3, -3.0); w.castShadow = false; scene.add(w);
      }
      for (const pl of list) { // railings + flower pots
        const rail = box(pl.w, 0.12, 0.12, 0x5b3d22); rail.position.set(pl.x, pl.y + 0.95, 1.0); scene.add(rail);
        for (let i = -1; i <= 1; i += 2) { const post = box(0.1, 0.95, 0.1, 0x5b3d22); post.position.set(pl.x + i * (pl.w / 2 - 0.1), pl.y + 0.48, 1.0); scene.add(post); }
        if (pl.x % 2 === 0 || pl.x > 40) {
          const pot = cyl(0.3, 0.22, 0.4, 0xb5522e, 8); pot.position.set(pl.x - pl.w / 2 + 0.6, pl.y + 0.2, -2.4); scene.add(pot);
          const fl = sph(0.28, [0xff5f8a, 0xffd23f, 0xff8f3a][Math.floor(pl.x) % 3], 8); fl.position.set(pl.x - pl.w / 2 + 0.6, pl.y + 0.6, -2.4); scene.add(fl);
        }
      }
      const street = box(400, 1, 200, 0x55555c); street.position.set(40, -40, 40); scene.add(street);
      for (let i = 0; i < 10; i++) { const b = box(14, 40 + (i % 3) * 14, 14, [0xb8a58b, 0x9fb1c4, 0xc7a79b][i % 3]); b.position.set(-30 + i * 22, -20, 28); scene.add(b); }
      // the hook line that gets "snipped"
      const hook = cyl(0.04, 0.04, 40, 0x888888, 6); hook.position.set(148, -14, 0); scene.add(hook);
    },
  };
  return new Platformer(ctx, cfg);
}

/* ================= CHAPTER 1: fairground ================= */
function fairground(ctx) {
  const wall = (x, z, d, c = 0x9fe3f0) => ({ x, y: 3.6, z, w: 0.8, h: 3.6, d, color: c });
  const list = [
    { x: 60, y: 0, z: 0, w: 230, h: 1, d: 34, color: 0x74b05a, cp: true },
    wall(6, 3, 14), wall(11.5, -3, 14), wall(17, 3, 14), wall(22.5, -3, 14),
    ...rows([[46, 1.2, 3, 3, {}], [50, 2.4, 3, 3, {}]], { color: 0xd8b36a }),
    ...rows([
      [64, 1.4, 3, 3], [68.5, 2.9, 3, 3, { cp: true }], [73, 4.4, 3, 3, { move: { axis: 'y', range: 0.7, speed: 1.2 } }],
      [77.5, 6, 3, 3], [82, 7.5, 4, 3, { cp: true }], [86.5, 6, 3, 3], [90.5, 4.2, 3, 3], [94.5, 2.4, 3, 3],
    ], { color: 0xe05a5a }),
    ...rows([
      [112, 1.6, 4, 4], [118, 3.2, 4, 4, { move: { axis: 'z', range: 3, speed: 1 } }], [124, 4.8, 4, 4, { move: { axis: 'z', range: 3, speed: 1, phase: 3 } }],
      [130, 6.4, 5, 5, { cp: true }], [136, 4.4, 4, 4], [141, 2.4, 4, 4],
    ], { color: 0xb86bd9 }),
  ];
  const cfg = {
    sky: 0xffd9a8, platforms: list, spawn: [0, 0.1, 0], killY: -10,
    camYaw: 0,
    tickets: [[19.5, 1.0, 8.5], [50, 3.5, 0], [82, 8.7, 0], [130, 7.5, 0]],
    hazards: [
      { type: 'slider', from: [104, 0.9, -12], to: [104, 0.9, 12], speed: 1.7, r: 0.9, color: 0x3aa0ff },
      { type: 'slider', from: [108, 0.9, 12], to: [108, 0.9, -12], speed: 1.4, r: 0.9, color: 0xe64a4a, phase: 1 },
      { type: 'slider', from: [148, 0.9, -12], to: [148, 0.9, 12], speed: 1.8, r: 0.9, color: 0x3aa0ff, phase: 2 },
      { type: 'slider', from: [9, 0.7, -12], to: [9, 0.7, 12], speed: 1.1, r: 0.6 },
      { type: 'slider', from: [14.5, 0.7, 12], to: [14.5, 0.7, -12], speed: 1.3, r: 0.6, phase: 1 },
      { type: 'slider', from: [20, 0.7, -12], to: [20, 0.7, 12], speed: 1.2, r: 0.6, phase: 2 },
      { type: 'slider', from: [34, 0.8, -12], to: [34, 0.8, 12], speed: 1.5, r: 0.7, color: 0xe8c33a },
      { type: 'slider', from: [38.5, 0.8, 12], to: [38.5, 0.8, -12], speed: 1.8, r: 0.7, color: 0xe8c33a, phase: 1 },
      { type: 'slider', from: [43, 0.8, -12], to: [43, 0.8, 12], speed: 1.6, r: 0.7, color: 0xe8c33a, phase: 3 },
      { type: 'pendulum', pivot: [75.3, 12.5, 0], len: 6.2, amp: 0.55, speed: 1.6, axis: 'z', r: 0.6, color: 0x8a2be2 },
    ],
    goal: { pos: [156, 0, 0], need: 4 },
    hitMsg: 'Bonk! The Wolf\'s trap got you.',
    build(scene) {
      // ferris wheel decor
      const wheel = new THREE.Group(); wheel.position.set(80, 13, -10);
      const rim = mesh(new THREE.TorusGeometry(12, 0.35, 8, 40), mat(0xd9363e)); wheel.add(rim);
      for (let i = 0; i < 8; i++) { const sp = box(0.2, 24, 0.2, 0xeeeeee); sp.rotation.z = (i / 8) * Math.PI; wheel.add(sp); }
      scene.add(wheel);
      const legs = [box(0.8, 14, 0.8, 0x555555), box(0.8, 14, 0.8, 0x555555)];
      legs[0].position.set(76, 6, -10); legs[0].rotation.z = -0.25; legs[1].position.set(84, 6, -10); legs[1].rotation.z = 0.25; scene.add(...legs);
      const gondolas = [];
      for (let i = 0; i < 10; i++) { const g = box(1.8, 1.4, 1.6, [0xffd23f, 0x3aa0ff, 0x4ad17a][i % 3]); scene.add(g); gondolas.push(g); }
      // entrance arch
      for (const s of [-1, 1]) { const post = box(0.9, 7, 0.9, 0xd9363e); post.position.set(-4, 3.5, s * 5); scene.add(post); }
      const arch = box(1.2, 1.6, 11.6, 0xffc933); arch.position.set(-4, 7.4, 0); scene.add(arch);
      for (let i = 0; i < 6; i++) { const bl = sph(0.7, [0xff5f8a, 0x3aa0ff, 0xffd23f][i % 3], 10); bl.position.set(-6 + (i % 2), 2 + i * 0.35, -7.5 + i * 3); scene.add(bl); }
      // tents & banners
      for (let i = 0; i < 6; i++) {
        const c = cone(3, 3.2, i % 2 ? 0xe64a4a : 0xf5f1e6, 6); c.position.set(30 + i * 7, 4.5, -17); scene.add(c);
        const b = box(5, 3, 5, i % 2 ? 0xf5f1e6 : 0xe64a4a); b.position.set(30 + i * 7, 1.5, -17); scene.add(b);
      }
      for (let i = 0; i < 8; i++) { const lamp = cyl(0.1, 0.1, 5, 0x444444, 6); lamp.position.set(-2 + i * 14, 2.5, 14); scene.add(lamp); const bulb = sph(0.35, mat(0xfff0a0, 0xaa8800), 8); bulb.position.set(-2 + i * 14, 5.2, 14); scene.add(bulb); }
      // exit tram
      const tram = box(7, 3, 3, 0x2f9e5c); tram.position.set(160, 1.5, -4); scene.add(tram);
      const tw = box(5.6, 1, 3.1, 0xcfefff); tw.position.set(160, 2, -4); scene.add(tw);
      // carousel
      const cb = cyl(5, 5, 0.6, 0xffc933, 24); cb.position.set(124, 0.3, -12); scene.add(cb);
      const cr = cone(6, 3, 0xd9363e, 14); cr.position.set(124, 7, -12); scene.add(cr);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const po = cyl(0.12, 0.12, 5, 0xffffff, 6); po.position.set(124 + Math.cos(a) * 4, 3, -12 + Math.sin(a) * 4); scene.add(po); }
      // hall-of-mirrors sign
      const sign = box(6, 1.4, 0.4, 0xc02a8a); sign.position.set(14, 8, -12); scene.add(sign);
      return (t) => {
        wheel.rotation.z = t * 0.12;
        gondolas.forEach((g, i) => { const a = t * 0.12 + (i / 10) * Math.PI * 2; g.position.set(80 + Math.cos(a) * 12, 13 + Math.sin(a) * 12, -10); });
      };
    },
  };
  return new Platformer(ctx, cfg);
}

/* ================= CHAPTER 2b: construction site ================= */
function construction(ctx) {
  const steel = 0xe07b22;
  const list = rows([
    [0, 0, 8, 5, { cp: true }], [9, 0.5, 4, 3], [15.5, 1.5, 4, 3], [22.5, 2.5, 3, 3, { move: { axis: 'x', range: 2.2, speed: 1.2 } }],
    [30.5, 2.5, 5, 4, { cp: true }], [37.5, 3.5, 3, 3], [44, 4.5, 3.4, 3.4], [50.5, 5.5, 4, 3],
    [57.5, 5.5, 2.6, 2.6, { move: { axis: 'y', range: 1.4, speed: 1.4 } }], [64.5, 6.5, 5, 4, { cp: true }], [71.5, 7.5, 3, 3],
    [77.5, 8.5, 3, 3, { move: { axis: 'x', range: 2, speed: 1.4 } }], [85, 9.5, 5, 4, { cp: true }], [92, 10.5, 3, 3], [99.5, 11.5, 4, 4],
    [106, 12.4, 3, 3, { move: { axis: 'x', range: 2, speed: 1.3 } }], [113, 13.2, 3, 3], [119.5, 14, 3.4, 3.4], [126, 14.8, 3, 3, { move: { axis: 'y', range: 1.3, speed: 1.4 } }],
    [133, 15.6, 5, 4, { cp: true }], [140, 16.4, 3, 3], [146, 17.2, 3, 3, { move: { axis: 'x', range: 2, speed: 1.4 } }], [153, 18, 9, 6],
  ], { color: steel });
  const pend = (x, top, ph = 0, axis = 'x', sp = 2) => ({ type: 'pendulum', pivot: [x, top + 6.5, 0], len: 5.2, amp: 0.85, speed: sp, axis, r: 0.9, color: 0x3a3a42, phase: ph });
  const cfg = {
    sky: 0xbfe0f5, platforms: list, spawn: [0, 0.1, 0], killY: -12, moverColor: 0xf2d43a,
    hazards: [pend(37.5, 3.5, 0, 'x'), pend(44, 4.5, 1, 'z'), pend(50.5, 5.5, 2, 'x'), pend(71.5, 7.5, 0.5, 'z', 2.2), pend(92, 10.5, 1.4, 'x', 2.2), pend(119.5, 14, 0.7, 'z', 2), pend(140, 16.4, 2, 'x', 2.2)],
    goal: { pos: [154, 18, 0], need: 0 },
    hitMsg: 'Wrecking ball! Back to the last girder!',
    build(scene) {
      const pit = box(500, 1, 300, 0x8c7a5c); pit.position.set(50, -30, 0); scene.add(pit);
      for (let i = 0; i < 9; i++) { // tower cranes
        const x = 5 + i * 20, z = -16 - (i % 2) * 6;
        const mast = box(1.2, 40, 1.2, 0xf2c200); mast.position.set(x, 4 + (i % 3) * 3, z); scene.add(mast);
        const jib = box(22, 0.8, 0.8, 0xf2c200); jib.position.set(x + 6, 24 + (i % 3) * 3, z); scene.add(jib);
        const cw = box(3, 2, 2, 0x666666); cw.position.set(x - 6, 23 + (i % 3) * 3, z); scene.add(cw);
        const cable = cyl(0.04, 0.04, 8, 0x333333, 4); cable.position.set(x + 12, 20 + (i % 3) * 3, z); scene.add(cable);
      }
      for (let i = 0; i < 12; i++) { const b = box(8, 30 + (i % 3) * 10, 8, [0xa7b0bd, 0x9aa5b5, 0xb8c0cc][i % 3]); b.position.set(-10 + i * 20, -5, -45); scene.add(b); }
      const sta = box(14, 6, 8, 0xc9c1b0); sta.position.set(162, 21, -3); scene.add(sta);
      const sg = box(8, 1.2, 0.4, 0x2b5da8); sg.position.set(162, 24.7, 1.2); scene.add(sg);
    },
  };
  return new Platformer(ctx, cfg);
}

/* ================= runner theme builders ================= */
const rng2 = (rng, a, b) => a + rng() * (b - a);

function highwayObstacle(kind, rng, w) {
  const g = new THREE.Group();
  if (kind === 'low') {
    const b = box(w, 1.0, 0.8, 0xf2f2f2); b.position.y = 0.5; g.add(b);
    for (let i = -1; i <= 1; i++) { const s = box(w / 4, 1.01, 0.82, 0xe8501f); s.position.set(i * w / 3, 0.5, 0); g.add(s); }
  } else if (kind === 'high') {
    for (const s of [-1, 1]) { const p = box(0.6, 3.4, 0.6, 0x666b73); p.position.set(s * (w / 2 + 0.2), 1.7, 0); g.add(p); }
    const sign = box(w + 0.8, 1.3, 0.5, 0x1f7a3a); sign.position.y = 1.95 + 0.0; sign.position.y = 1.95; g.add(sign);
    const stripe = box(w - 1, 0.12, 0.52, 0xffffff); stripe.position.y = 2.05; g.add(stripe);
  } else {
    const c = [0x2f6fd0, 0xd04a2f, 0xe0c030, 0x3aa86a][Math.floor(rng() * 4)];
    const b = box(w - 0.4, 1.0, 3.4, c); b.position.y = 0.7; g.add(b);
    const t = box(w - 0.9, 0.7, 1.8, 0x9fdcff); t.position.set(0, 1.45, 0.2); g.add(t);
    for (const sx of [-1, 1]) for (const sz of [-1.1, 1.1]) { const wl = cyl(0.38, 0.38, 0.3, 0x222222, 10); wl.rotation.z = Math.PI / 2; wl.position.set(sx * (w / 2 - 0.1), 0.38, sz); g.add(wl); }
  }
  return g;
}
function highwayScenery(rng) {
  const g = new THREE.Group();
  if (rng() < 0.7) {
    const h = rng2(rng, 8, 26);
    const b = box(rng2(rng, 6, 10), h, rng2(rng, 6, 10), [0xc9b79c, 0xb0b8c2, 0xd4a58f, 0x9fb9c9][Math.floor(rng() * 4)]); b.position.y = h / 2; g.add(b);
    const win = box(b.geometry.parameters.width * 0.8, h * 0.6, 0.3, 0x56789a); win.position.set(0, h * 0.55, b.geometry.parameters.depth / 2 + 0.05); g.add(win);
  } else {
    const p = cyl(0.12, 0.12, 6, 0x444444, 6); p.position.y = 3; g.add(p);
    const l = sph(0.4, mat(0xfff0a0, 0xaa8800), 6); l.position.y = 6.2; g.add(l);
  }
  return g;
}

function museumObstacle(kind, rng, w) {
  const g = new THREE.Group();
  if (kind === 'low') { // rolling cannon
    const barrel = cyl(0.32, 0.42, 2.0, 0x30343c, 10); barrel.rotation.x = Math.PI / 2.4; barrel.position.y = 0.75; g.add(barrel);
    const base = box(w * 0.8, 0.4, 1.4, 0x6a4a2a); base.position.y = 0.4; g.add(base);
    for (const s of [-1, 1]) { const wl = cyl(0.5, 0.5, 0.2, 0x6a4a2a, 12); wl.rotation.z = Math.PI / 2; wl.position.set(s * (w * 0.4), 0.5, 0); g.add(wl); }
    const ball = sph(0.3, 0x222222, 8); ball.position.set(0, 1.0, -1.1); g.add(ball);
  } else if (kind === 'high') { // chandelier / hanging blades
    const bar = box(w + 0.8, 0.5, 0.8, 0xd9b44a); bar.position.y = 1.9; g.add(bar);
    for (let i = -3; i <= 3; i++) { const bl = cone(0.18, 0.8, 0xd8dde6, 4); bl.rotation.x = Math.PI; bl.position.set(i * (w / 6.5), 1.4, 0); g.add(bl); }
    for (const s of [-1, 1]) { const ch = box(0.12, 3, 0.12, 0x777777); ch.position.set(s * (w / 2), 3.4, 0); g.add(ch); }
  } else { // armour knight
    const body = mesh(new THREE.CapsuleGeometry(0.55, 1.2, 4, 10), 0x9aa3ae); body.position.y = 1.3; g.add(body);
    const head = sph(0.4, 0xb6bec8, 10); head.position.y = 2.5; g.add(head);
    const plume = cone(0.15, 0.7, 0xd0383f, 6); plume.position.y = 3.1; g.add(plume);
    const sword = box(0.12, 2.4, 0.12, 0xdfe5ee); sword.position.set(0.8, 1.5, 0); g.add(sword);
  }
  return g;
}
function museumScenery(rng) {
  const g = new THREE.Group();
  const r = rng();
  if (r < 0.5) {
    const p = cyl(0.9, 1.1, rng2(rng, 10, 18), 0xe9e2f2, 12); p.position.y = p.geometry.parameters.height / 2; g.add(p);
  } else if (r < 0.85) {
    const f = box(3, 4, 0.25, [0xff7ab6, 0x7ad7ff, 0xffd36b][Math.floor(rng() * 3)]); f.position.y = rng2(rng, 3, 9); f.rotation.set(rng() - 0.5, rng() * 3, rng() - 0.5); g.add(f);
  } else {
    const c = sph(1.6, mat(0xfff2a8, 0x665500), 12); c.position.y = rng2(rng, 4, 10); g.add(c);
    const h = box(0.15, 1.2, 0.1, 0x222222); h.position.set(0, c.position.y + 0.4, 1.5); g.add(h);
  }
  return g;
}

function skiObstacle(kind, rng, w) {
  const g = new THREE.Group();
  if (kind === 'low') {
    const r = sph(1.1, 0x8d949c, 8); r.scale.set(w / 2.3, 0.55, 0.7); r.position.y = 0.2; g.add(r);
    const s = sph(0.9, 0xffffff, 8); s.scale.set(w / 2.9, 0.4, 0.6); s.position.y = 0.75; g.add(s);
  } else if (kind === 'high') {
    for (const s of [-1, 1]) { const p = cyl(0.25, 0.3, 3.6, 0x6b4a2a, 8); p.position.set(s * (w / 2 + 0.2), 1.8, 0); g.add(p); }
    const bar = box(w + 0.6, 1.1, 0.4, 0xd0383f); bar.position.y = 2.0; g.add(bar);
    const st = box(w - 0.5, 0.25, 0.42, 0xffffff); st.position.y = 2.0; g.add(st);
  } else {
    const t = new THREE.Group();
    const tr = cyl(0.3, 0.4, 1.2, 0x5b3a21, 6); tr.position.y = 0.6; t.add(tr);
    for (let i = 0; i < 3; i++) { const c = cone(1.6 - i * 0.35, 2, 0x1f7a3a, 8); c.position.y = 1.8 + i * 1.2; t.add(c); }
    const sn = cone(0.5, 0.8, 0xffffff, 8); sn.position.y = 5.0; t.add(sn);
    g.add(t);
  }
  return g;
}
function skiScenery(rng) {
  const g = new THREE.Group();
  const s = rng2(rng, 0.8, 1.7);
  const tr = cyl(0.3, 0.4, 1.2, 0x5b3a21, 6); tr.position.y = 0.6 * s; tr.scale.setScalar(s); g.add(tr);
  for (let i = 0; i < 3; i++) { const c = cone((1.8 - i * 0.4) * s, 2.2 * s, 0x2a8a46, 8); c.position.y = (1.8 + i * 1.3) * s; g.add(c); }
  if (rng() < 0.3) { const l = sph(0.2, mat(0xff4455, 0x882222), 6); l.position.set(0.8 * s, 2.2 * s, 0.8 * s); g.add(l); }
  return g;
}

/* ================= level list ================= */
export { balcony, fairground, construction, highwayObstacle, highwayScenery, museumObstacle, museumScenery, skiObstacle, skiScenery, PLAT_CONTROLS, RUN_CONTROLS };
