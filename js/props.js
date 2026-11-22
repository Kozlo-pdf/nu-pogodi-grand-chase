import { THREE, box, cyl, sph, cone, mat, mesh, makeWheel } from './common.js';

/* =====================================================================
   Shared model kit. Conventions: feet/wheels on y=0. Vehicles: FRONT = -z.
   Characters/animals built here face +z unless noted.
   ===================================================================== */

const shade = (c, f) => { const o = new THREE.Color(c); o.multiplyScalar(f); return o.getHex(); };
const noCast = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); return g; };

/* ---------- characters / creatures ---------- */
export function makeHippo() {
  const g = new THREE.Group();
  const skin = 0x9a8fa3, belly = 0xb9aab9, uni = 0x3a4f85;
  const body = mesh(new THREE.CapsuleGeometry(0.74, 0.75, 6, 14), uni); body.position.y = 1.25; g.add(body);
  const bel = sph(0.55, belly, 12); bel.scale.set(1, 1.1, 0.5); bel.position.set(0, 1.1, 0.55); g.add(bel);
  for (let i = 0; i < 3; i++) { const b = sph(0.06, mat(0xffd23f, 0x886600), 6); b.position.set(0, 1.55 - i * 0.28, 0.72); g.add(b); }
  const belt = cyl(0.76, 0.76, 0.1, 0x1a1a1a, 14); belt.position.y = 0.82; g.add(belt);
  const buckle = box(0.2, 0.14, 0.05, 0xffd23f); buckle.position.set(0, 0.82, 0.75); g.add(buckle);
  const tie = box(0.14, 0.4, 0.04, 0x1a2a5a); tie.position.set(0, 1.85, 0.62); g.add(tie);

  const head = new THREE.Group(); head.position.set(0, 2.25, 0.1); g.add(head);
  const skull = sph(0.66, skin, 16); skull.scale.set(1.12, 0.92, 1.05); head.add(skull);
  const snout = sph(0.5, belly, 14); snout.scale.set(1.25, 0.78, 1); snout.position.set(0, -0.2, 0.52); head.add(snout);
  const mouth = box(0.78, 0.05, 0.05, 0x4a3a4a); mouth.position.set(0, -0.28, 0.98); head.add(mouth);
  for (const s of [-1, 1]) {
    const nos = sph(0.07, 0x4a3a4a, 6); nos.position.set(s * 0.2, -0.04, 0.98); head.add(nos);
    const eyeW = sph(0.11, 0xffffff, 8); eyeW.position.set(s * 0.32, 0.22, 0.52); head.add(eyeW);
    const pu = sph(0.05, 0x111111, 6); pu.position.set(s * 0.32, 0.22, 0.62); head.add(pu);
    const lid = box(0.22, 0.05, 0.1, skin); lid.position.set(s * 0.32, 0.3, 0.58); lid.rotation.z = -s * 0.25; head.add(lid);
    const ear = sph(0.16, skin, 8); ear.scale.set(1, 1.2, 0.6); ear.position.set(s * 0.5, 0.58, -0.1); head.add(ear);
    const earIn = sph(0.08, 0xd8a0b0, 6); earIn.position.set(s * 0.5, 0.58, -0.04); head.add(earIn);
    const arm = mesh(new THREE.CapsuleGeometry(0.2, 0.55, 4, 8), uni); arm.position.set(s * 0.9, 1.3, 0.1); arm.rotation.z = s * 0.18; g.add(arm);
    const hand = sph(0.2, skin, 8); hand.position.set(s * 1.0, 0.82, 0.12); g.add(hand);
    const leg = mesh(new THREE.CapsuleGeometry(0.24, 0.35, 4, 8), 0x2a3a66); leg.position.set(s * 0.38, 0.42, 0); g.add(leg);
    const boot = box(0.5, 0.22, 0.7, 0x151515); boot.position.set(s * 0.38, 0.11, 0.12); g.add(boot);
  }
  const cap = cyl(0.55, 0.62, 0.34, 0x1f2a4a, 14); cap.position.set(0, 0.75, 0); head.add(cap);
  const capTop = cyl(0.6, 0.6, 0.08, 0x1f2a4a, 14); capTop.position.set(0, 0.95, 0); head.add(capTop);
  const peak = box(0.78, 0.06, 0.45, 0x0e0e12); peak.position.set(0, 0.62, 0.55); head.add(peak);
  const badge = sph(0.09, mat(0xffd23f, 0x886600), 8); badge.position.set(0, 0.8, 0.6); head.add(badge);
  const baton = cyl(0.05, 0.05, 0.9, 0x111111, 6); baton.position.set(1.05, 1.0, 0.45); baton.rotation.x = 0.9; g.add(baton);
  const whistle = cyl(0.04, 0.04, 0.12, 0xcccccc, 6); whistle.rotation.z = Math.PI / 2; whistle.position.set(0.1, -0.3, 1.0); head.add(whistle);
  g.userData.head = head;
  return g;
}

export function makeWitch() {
  const g = new THREE.Group();
  const cloak = cone(0.95, 2.5, 0x3a2a4a, 14); cloak.position.y = 1.25; g.add(cloak);
  const hem = cyl(0.96, 0.96, 0.12, 0x6a3a8a, 14); hem.position.y = 0.06; g.add(hem);
  const shawl = sph(0.55, 0x6a3a8a, 10); shawl.scale.set(1.2, 0.5, 1); shawl.position.y = 2.2; g.add(shawl);
  const head = sph(0.4, 0x9ac28a, 12); head.position.y = 2.65; g.add(head);
  const nose = cone(0.1, 0.5, 0x82ae72, 6); nose.rotation.x = Math.PI / 2 + 0.2; nose.position.set(0, 2.58, 0.5); g.add(nose);
  const wart = sph(0.035, 0x4a6a3a, 5); wart.position.set(0.04, 2.55, 0.74); g.add(wart);
  for (const s of [-1, 1]) {
    const eye = sph(0.07, 0xffe36b, 8); eye.position.set(s * 0.15, 2.72, 0.33); g.add(eye);
    const pu = sph(0.03, 0x111111, 6); pu.position.set(s * 0.15, 2.72, 0.39); g.add(pu);
    const brow = box(0.16, 0.03, 0.03, 0x222222); brow.position.set(s * 0.15, 2.82, 0.36); brow.rotation.z = s * 0.4; g.add(brow);
    const hair = mesh(new THREE.CapsuleGeometry(0.05, 0.7, 4, 6), 0xcfcfd8); hair.position.set(s * 0.38, 2.35, -0.05); hair.rotation.z = s * 0.2; g.add(hair);
  }
  const brim = cyl(0.85, 0.85, 0.06, 0x1a1020, 16); brim.position.y = 2.98; g.add(brim);
  const hat = cone(0.5, 0.9, 0x1a1020, 12); hat.position.y = 3.45; g.add(hat);
  const hat2 = cone(0.25, 0.7, 0x1a1020, 10); hat2.position.set(0.12, 4.05, 0); hat2.rotation.z = -0.5; g.add(hat2);
  const band = cyl(0.51, 0.51, 0.12, 0x9a4adb, 12); band.position.y = 3.1; g.add(band);
  const broom = cyl(0.04, 0.04, 2.4, 0x8a5a2a, 6); broom.rotation.z = Math.PI / 2.4; broom.position.set(0.7, 1.3, 0.3); g.add(broom);
  for (let i = 0; i < 7; i++) { const b = cone(0.05, 0.5, 0xd9b26f, 4); b.rotation.z = Math.PI / 2.4 - Math.PI / 2; b.position.set(1.3 + i * 0.015, 0.56 + (i - 3) * 0.04, 0.3 + (i - 3) * 0.06); g.add(b); }
  return g;
}

export function makeBear() {
  const g = new THREE.Group(); const fur = 0x7a5230, light = 0xc9a070;
  const body = sph(1.5, fur, 14); body.scale.set(1, 1.2, 0.9); body.position.y = 2.2; g.add(body);
  const belly = sph(1.0, light, 12); belly.scale.set(1, 1.1, 0.5); belly.position.set(0, 2.1, 0.85); g.add(belly);
  const head = sph(0.9, fur, 14); head.position.y = 4.3; g.add(head);
  const snout = sph(0.46, light, 10); snout.scale.set(1, 0.8, 1); snout.position.set(0, 4.1, 0.78); g.add(snout);
  const nose = sph(0.14, 0x111111, 8); nose.position.set(0, 4.28, 1.18); g.add(nose);
  const mouth = box(0.3, 0.04, 0.04, 0x3a2418); mouth.position.set(0, 3.92, 1.2); g.add(mouth);
  for (const s of [-1, 1]) {
    const ear = sph(0.3, fur, 8); ear.position.set(s * 0.68, 5.0, 0); g.add(ear);
    const earIn = sph(0.16, light, 6); earIn.position.set(s * 0.68, 5.0, 0.1); g.add(earIn);
    const eye = sph(0.1, 0x111111, 6); eye.position.set(s * 0.34, 4.5, 0.74); g.add(eye);
    const brow = box(0.3, 0.07, 0.06, 0x3a2418); brow.position.set(s * 0.34, 4.7, 0.78); brow.rotation.z = s * 0.45; g.add(brow);
    const arm = new THREE.Group(); arm.position.set(s * 1.5, 3.1, 0);
    const a = mesh(new THREE.CapsuleGeometry(0.42, 0.9, 4, 8), fur); a.position.y = -0.6; arm.add(a);
    const glove = sph(0.6, 0xd9363e, 10); glove.position.y = -1.4; arm.add(glove);
    const cuff = cyl(0.45, 0.45, 0.14, 0xffffff, 10); cuff.position.y = -1.05; arm.add(cuff);
    g.add(arm); g['arm' + (s < 0 ? 'L' : 'R')] = arm;
    const leg = mesh(new THREE.CapsuleGeometry(0.42, 0.6, 4, 8), fur); leg.position.set(s * 0.6, 0.6, 0); g.add(leg);
    const foot = sph(0.45, light, 8); foot.scale.set(1, 0.6, 1.4); foot.position.set(s * 0.6, 0.15, 0.2); g.add(foot);
  }
  const shorts = cyl(1.2, 1.38, 0.95, 0x2a58b8, 14); shorts.position.y = 1.4; g.add(shorts);
  const band = cyl(1.22, 1.22, 0.16, 0xffffff, 14); band.position.y = 1.88; g.add(band);
  const belt = box(1.0, 0.5, 0.05, mat(0xffd23f, 0x664400)); belt.position.set(0, 1.45, 1.38); g.add(belt);
  return g;
}

export function makeBoar() {
  const g = new THREE.Group(); const fur = 0x6b4a32, dark = 0x3a2a1a;
  const body = mesh(new THREE.CapsuleGeometry(0.58, 1.0, 6, 12), fur); body.rotation.x = Math.PI / 2; body.position.y = 0.75; g.add(body);
  const mane = mesh(new THREE.CapsuleGeometry(0.3, 0.9, 4, 8), dark); mane.rotation.x = Math.PI / 2; mane.position.set(0, 1.28, -0.1); g.add(mane);
  for (let i = 0; i < 6; i++) { const sp = cone(0.07, 0.3, dark, 4); sp.position.set(0, 1.55, -0.6 + i * 0.22); g.add(sp); }
  const head = sph(0.5, 0x5a3a28, 12); head.scale.set(1, 0.95, 1.1); head.position.set(0, 0.85, -1.3); g.add(head);
  const snout = cyl(0.26, 0.3, 0.34, 0xd9a0a0, 10); snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.74, -1.72); g.add(snout);
  for (const s of [-1, 1]) {
    const nos = sph(0.045, 0x4a2a2a, 5); nos.position.set(s * 0.1, 0.76, -1.9); g.add(nos);
    const tusk = cone(0.065, 0.46, 0xf0e6c8, 6); tusk.rotation.x = -2.2; tusk.rotation.z = -s * 0.3; tusk.position.set(s * 0.28, 0.6, -1.75); g.add(tusk);
    const eye = sph(0.05, 0x111111, 6); eye.position.set(s * 0.3, 1.0, -1.55); g.add(eye);
    const ear = cone(0.15, 0.32, fur, 5); ear.position.set(s * 0.32, 1.3, -1.15); ear.rotation.z = -s * 0.4; g.add(ear);
    for (const z of [-0.55, 0.65]) {
      const lg = cyl(0.11, 0.09, 0.55, dark, 6); lg.position.set(s * 0.32, 0.28, z); g.add(lg);
      const hoof = cyl(0.12, 0.12, 0.1, 0x1a1a1a, 6); hoof.position.set(s * 0.32, 0.04, z); g.add(hoof);
    }
  }
  const tail = cyl(0.025, 0.025, 0.5, dark, 4); tail.position.set(0, 1.0, 1.25); tail.rotation.x = -0.7; g.add(tail);
  return g;
}

export function makeLion() {
  const g = new THREE.Group(); const fur = 0xd9a24a, mane = 0x8a5a2a;
  const body = mesh(new THREE.CapsuleGeometry(0.5, 1.1, 6, 10), fur); body.rotation.z = Math.PI / 2; body.position.y = 0.95; g.add(body);
  const maneM = sph(0.72, mane, 12); maneM.position.set(0.85, 1.15, 0); g.add(maneM);
  const head = sph(0.45, fur, 12); head.position.set(1.15, 1.1, 0); g.add(head);
  const snout = sph(0.22, 0xe8c27a, 8); snout.position.set(1.52, 0.98, 0); g.add(snout);
  const nose = sph(0.06, 0x2a1a1a, 6); nose.position.set(1.72, 1.04, 0); g.add(nose);
  for (const s of [-1, 1]) {
    const eye = sph(0.05, 0x111111, 5); eye.position.set(1.45, 1.22, s * 0.2); g.add(eye);
    const ear = sph(0.12, fur, 6); ear.position.set(1.05, 1.58, s * 0.3); g.add(ear);
    for (const x of [-0.7, 0.7]) { const lg = mesh(new THREE.CapsuleGeometry(0.14, 0.45, 4, 6), fur); lg.position.set(x, 0.38, s * 0.3); g.add(lg); }
  }
  const tail = mesh(new THREE.CapsuleGeometry(0.05, 0.9, 4, 6), fur); tail.rotation.z = 1.1; tail.position.set(-1.25, 1.2, 0); g.add(tail);
  const tuft = sph(0.14, mane, 6); tuft.position.set(-1.62, 1.55, 0); g.add(tuft);
  return g;
}

export function makeKnight() {
  const g = new THREE.Group(); const steel = 0x9aa3ae, lite = 0xc4ccd6;
  const body = mesh(new THREE.CapsuleGeometry(0.55, 1.1, 6, 12), steel); body.position.y = 1.35; g.add(body);
  const plate = sph(0.5, lite, 10); plate.scale.set(1, 1.1, 0.5); plate.position.set(0, 1.6, 0.4); g.add(plate);
  const skirt = cyl(0.6, 0.78, 0.5, steel, 12); skirt.position.y = 0.75; g.add(skirt);
  const helm = sph(0.42, lite, 12); helm.position.y = 2.55; g.add(helm);
  const visor = box(0.55, 0.08, 0.2, 0x222222); visor.position.set(0, 2.55, 0.36); g.add(visor);
  const slit = box(0.05, 0.3, 0.2, 0x222222); slit.position.set(0, 2.5, 0.38); g.add(slit);
  const plume = cone(0.15, 0.8, 0xd0383f, 6); plume.position.y = 3.2; g.add(plume);
  for (const s of [-1, 1]) {
    const sh = sph(0.3, lite, 8); sh.position.set(s * 0.7, 2.1, 0); g.add(sh);
    const leg = mesh(new THREE.CapsuleGeometry(0.2, 0.4, 4, 8), steel); leg.position.set(s * 0.28, 0.3, 0); g.add(leg);
  }
  const sword = box(0.1, 2.4, 0.06, 0xdfe5ee); sword.position.set(0.9, 1.6, 0.15); g.add(sword);
  const guard = box(0.5, 0.08, 0.1, 0xd9b44a); guard.position.set(0.9, 0.7, 0.15); g.add(guard);
  const shield = cyl(0.55, 0.55, 0.08, 0xd0383f, 12); shield.rotation.x = Math.PI / 2; shield.position.set(-0.85, 1.4, 0.3); g.add(shield);
  const emb = sph(0.16, mat(0xffd23f, 0x664400), 6); emb.position.set(-0.85, 1.4, 0.38); g.add(emb);
  return g;
}

export function makeCannon() {
  const g = new THREE.Group();
  const barrel = cyl(0.34, 0.5, 2.2, 0x30343c, 12); barrel.rotation.x = Math.PI / 2.3; barrel.position.set(0, 0.95, -0.2); g.add(barrel);
  const muzzle = cyl(0.42, 0.38, 0.2, 0x1a1c22, 12); muzzle.rotation.x = Math.PI / 2.3; muzzle.position.set(0, 1.5, -1.1); g.add(muzzle);
  const base = box(1.5, 0.35, 1.4, 0x6a4a2a); base.position.y = 0.55; g.add(base);
  for (const s of [-1, 1]) {
    const w = new THREE.Group(); const rim = mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 14), 0x4a3a22); rim.rotation.y = Math.PI / 2; w.add(rim);
    for (let i = 0; i < 4; i++) { const sp = box(0.06, 1.0, 0.06, 0x4a3a22); sp.rotation.x = i * Math.PI / 4; w.add(sp); }
    w.position.set(s * 0.85, 0.5, 0); g.add(w);
  }
  const ball = sph(0.28, 0x222222, 8); ball.position.set(0.3, 0.2, -0.9); g.add(ball);
  return g;
}

export function makeCarrot() {
  const g = new THREE.Group(); const orange = mat(0xffb020, 0x885500);
  const c = cone(0.21, 0.75, orange, 10); c.rotation.x = Math.PI; c.position.y = 0.4; g.add(c);
  for (let i = 0; i < 3; i++) { const r = cyl(0.205 - i * 0.01, 0.205 - i * 0.01, 0.03, 0xe08a10, 10); r.position.y = 0.55 - i * 0.2; g.add(r); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const l = cone(0.07, 0.42, 0x37c25a, 5); l.position.set(Math.cos(a) * 0.08, 0.92, Math.sin(a) * 0.08); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(l); }
  noCast(g);
  return g;
}

export function makeGear() {
  const g = new THREE.Group(); const gold = mat(0xffc933, 0x8a5a00, { metalness: 0.5, roughness: 0.4 });
  const ring = mesh(new THREE.TorusGeometry(0.72, 0.2, 10, 24), gold); g.add(ring);
  for (let i = 0; i < 12; i++) { const t = box(0.26, 0.3, 0.38, gold); const a = i / 12 * Math.PI * 2; t.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0); t.rotation.z = a; g.add(t); }
  for (let i = 0; i < 6; i++) { const sp = box(0.14, 0.55, 0.16, gold); const a = i / 6 * Math.PI; sp.rotation.z = a; g.add(sp); }
  const hub = cyl(0.26, 0.26, 0.42, gold, 12); hub.rotation.x = Math.PI / 2; g.add(hub);
  const bolt = sph(0.11, 0xfff0a0, 8); bolt.position.z = 0.22; g.add(bolt);
  g.scale.setScalar(1.1);
  return g;
}

/* ---------- vehicles (front = -z) ---------- */
function lamp(r, c = 0xffffcc) { return sph(r, mat(c, c), 8); }

export function makeBike() {
  const g = new THREE.Group(); const w1 = makeWheel(0.4), w2 = makeWheel(0.4); w1.position.z = -0.65; w2.position.z = 0.65;
  const red = 0xd43a3a;
  const bar = (len, c, x, y, z, rx, ry = 0, rz = 0) => { const b = cyl(0.035, 0.035, len, c, 6); b.position.set(x, y, z); b.rotation.set(rx, ry, rz); return b; };
  const top = bar(0.9, red, 0, 0.78, 0.0, Math.PI / 2 + 0.1); const down = bar(0.95, red, 0, 0.58, -0.15, Math.PI / 2 - 0.9);
  const seatT = bar(0.55, red, 0, 0.62, 0.45, 0.2), chain = bar(0.7, red, 0, 0.4, 0.4, Math.PI / 2 + 0.05);
  const fork = bar(0.7, 0x888888, 0, 0.55, -0.62, -0.25), stem = bar(0.3, 0x333333, 0, 0.98, -0.62, 0);
  const hbar = box(0.7, 0.045, 0.045, 0x222222); hbar.position.set(0, 1.12, -0.6);
  const saddle = box(0.2, 0.07, 0.38, 0x1a1a1a); saddle.position.set(0, 0.98, 0.5);
  const ped = box(0.4, 0.04, 0.1, 0x333333); ped.position.set(0, 0.35, 0.08);
  const bell = lamp(0.05, 0xdddddd); bell.position.set(0.25, 1.15, -0.6);
  g.add(w1, w2, top, down, seatT, chain, fork, stem, hbar, saddle, ped, bell);
  g.userData.wheels = [w1, w2];
  return g;
}

export function makeMotorcycle() {
  const g = new THREE.Group(); const w1 = makeWheel(0.42), w2 = makeWheel(0.42); w1.position.z = -0.8; w2.position.z = 0.8;
  const frame = box(0.34, 0.3, 1.6, 0x222222); frame.position.y = 0.72;
  const tank = sph(0.33, 0xc0392b, 12); tank.scale.set(0.9, 0.8, 1.5); tank.position.set(0, 1.02, -0.3);
  const seat = box(0.36, 0.14, 0.8, 0x151515); seat.position.set(0, 0.94, 0.45);
  const eng = box(0.46, 0.4, 0.5, 0x555b66); eng.position.set(0, 0.5, 0.05);
  const fork = cyl(0.04, 0.04, 0.9, 0x999999, 6); fork.position.set(0, 0.62, -0.84); fork.rotation.x = -0.3;
  const hbar = box(0.8, 0.05, 0.05, 0x222222); hbar.position.set(0, 1.14, -0.95);
  const light = lamp(0.18); light.position.set(0, 1.0, -1.1); light.scale.z = 0.7;
  const exh = cyl(0.07, 0.09, 1.1, 0xbbbbbb, 8); exh.rotation.x = Math.PI / 2; exh.position.set(0.28, 0.4, 0.55);
  const fend = box(0.3, 0.05, 0.7, 0xc0392b); fend.position.set(0, 0.92, -0.85);
  const tail = lamp(0.06, 0xff2a2a); tail.position.set(0, 0.95, 1.0);
  g.add(w1, w2, frame, tank, seat, eng, fork, hbar, light, exh, fend, tail);
  g.userData.wheels = [w1, w2];
  return g;
}

export function makeCar(color = 0xd8232a) {
  const g = new THREE.Group(); const dark = 0x1a1a1a;
  const chassis = box(2.1, 0.5, 4.3, color); chassis.position.y = 0.62; g.add(chassis);
  const hood = box(1.95, 0.22, 1.5, color); hood.position.set(0, 0.95, -1.3); g.add(hood);
  const trunk = box(1.95, 0.22, 1.0, color); trunk.position.set(0, 0.95, 1.6); g.add(trunk);
  const cab = box(1.8, 0.62, 1.9, 0x9fdcff); cab.position.set(0, 1.3, 0.3); g.add(cab);
  const roof = box(1.7, 0.1, 1.5, color); roof.position.set(0, 1.66, 0.3); g.add(roof);
  for (const [x, z] of [[-0.88, -0.6], [0.88, -0.6], [-0.88, 1.2], [0.88, 1.2]]) { const p = box(0.08, 0.66, 0.1, color); p.position.set(x, 1.3, z); g.add(p); }
  const wind = box(1.7, 0.1, 0.7, 0x7ac0e8); wind.position.set(0, 1.3, -0.62); wind.rotation.x = -0.6; g.add(wind);
  const bumpF = box(2.2, 0.2, 0.2, dark); bumpF.position.set(0, 0.42, -2.2); g.add(bumpF);
  const bumpB = box(2.2, 0.2, 0.2, dark); bumpB.position.set(0, 0.42, 2.2); g.add(bumpB);
  const grille = box(1.0, 0.22, 0.06, dark); grille.position.set(0, 0.7, -2.16); g.add(grille);
  const spoil = box(1.8, 0.07, 0.35, dark); spoil.position.set(0, 1.25, 2.0); g.add(spoil);
  for (const s of [-1, 1]) {
    const hl = lamp(0.2); hl.position.set(s * 0.7, 0.75, -2.1); hl.scale.z = 0.6; g.add(hl);
    const tl = lamp(0.14, 0xff2a2a); tl.position.set(s * 0.8, 0.75, 2.15); tl.scale.z = 0.5; g.add(tl);
    const mirror = box(0.2, 0.12, 0.1, color); mirror.position.set(s * 1.0, 1.15, -0.4); g.add(mirror);
  }
  const stripe = box(0.4, 0.02, 4.0, 0xffffff); stripe.position.set(0, 1.07, 0.1); g.add(stripe);
  const wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1.35, 1.35]) { const w = makeWheel(0.44); w.position.set(sx * 1.1, 0, sz); g.add(w); wheels.push(w); }
  g.userData.wheels = wheels;
  return g;
}

export function makeSteamroller() {
  const g = new THREE.Group(); const yel = 0xf0b400;
  const body = box(2.5, 1.2, 3.2, yel); body.position.set(0, 1.5, 0.7); g.add(body);
  const bonnet = box(2.1, 0.9, 1.3, yel); bonnet.position.set(0, 1.35, -1.4); g.add(bonnet);
  const chim = cyl(0.17, 0.2, 1.3, 0x333333, 8); chim.position.set(0.5, 2.5, -1.4); g.add(chim);
  const chimTop = cyl(0.25, 0.17, 0.15, 0x222222, 8); chimTop.position.set(0.5, 3.2, -1.4); g.add(chimTop);
  for (const sx of [-1, 1]) for (const sz of [0, 2]) { const p = box(0.1, 1.4, 0.1, 0x6b4f00); p.position.set(sx * 1.1, 2.9, sz - 0.1 + 0.3); g.add(p); }
  const canopy = box(2.5, 0.1, 2.4, 0x6b4f00); canopy.position.set(0, 3.6, 1.0); g.add(canopy);
  const seat = box(0.8, 0.2, 0.8, 0x222222); seat.position.set(0, 2.2, 1.0); g.add(seat);
  const roller = new THREE.Group(); roller.position.set(0, 1.15, -2.0);
  const rc = cyl(1.15, 1.15, 2.8, 0x8a8a8a, 22); rc.rotation.z = Math.PI / 2; roller.add(rc);
  for (const x of [-1.2, 0, 1.2]) { const band = cyl(1.18, 1.18, 0.1, 0x666666, 22); band.rotation.z = Math.PI / 2; band.position.x = x; roller.add(band); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const rv = sph(0.07, 0x444444, 5); rv.position.set(1.43, Math.cos(a) * 0.95, Math.sin(a) * 0.95); roller.add(rv); }
  g.add(roller);
  const wheels = [roller];
  for (const sx of [-1, 1]) { const w = makeWheel(1.1); w.position.set(sx * 1.4, 0, 1.5); g.add(w); wheels.push(w); const hub = cyl(0.4, 0.4, 0.3, yel, 10); hub.rotation.z = Math.PI / 2; hub.position.set(sx * 1.55, 1.1, 1.5); g.add(hub); }
  for (const s of [-1, 1]) { const l = lamp(0.2); l.position.set(s * 0.7, 1.7, -2.1); g.add(l); }
  g.userData.wheels = wheels;
  return g;
}

export function makeTrain() {
  const g = new THREE.Group(); const blue = 0x2a64b8;
  const body = box(3.4, 3.1, 9.2, blue); body.position.set(0, 1.9, 2); g.add(body);
  const stripe = box(3.45, 0.45, 9.25, 0xffffff); stripe.position.set(0, 1.35, 2); g.add(stripe);
  const roof = box(3.2, 0.2, 9.0, 0xc4ccd6); roof.position.set(0, 3.5, 2); g.add(roof);
  const front = box(3.3, 2.0, 0.3, 0x1f4a8a); front.position.set(0, 2.2, -2.6); g.add(front);
  const ws = box(2.4, 1.0, 0.1, 0x9fdcff); ws.position.set(0, 2.7, -2.78); g.add(ws);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) { const w = box(0.06, 0.9, 1.3, 0x9fdcff); w.position.set(s * 1.72, 2.4, -0.2 + i * 2.1); g.add(w); }
    const hl = lamp(0.3); hl.position.set(s * 1.0, 1.4, -2.72); g.add(hl);
  }
  const door = box(0.07, 1.8, 0.9, 0x1f4a8a); door.position.set(1.72, 1.9, 4.3); g.add(door);
  const pole = cyl(0.04, 0.04, 1.2, 0x333333, 5); pole.position.set(0, 3.9, 2); g.add(pole);
  const pan = box(1.4, 0.05, 0.5, 0x333333); pan.position.set(0, 4.5, 2); g.add(pan);
  return g;
}

export function makeHarvester() {
  const g = new THREE.Group(); const red = 0xd9363e;
  const body = box(3, 1.4, 4.2, red); body.position.y = 1.0; g.add(body);
  const cab = box(1.8, 1.5, 1.7, 0x9fdcff); cab.position.set(0, 2.2, 0.5); g.add(cab);
  const roof = box(2.0, 0.12, 1.9, red); roof.position.set(0, 3.0, 0.5); g.add(roof);
  for (const [x, z] of [[-0.9, -0.3], [0.9, -0.3], [-0.9, 1.3], [0.9, 1.3]]) { const p = box(0.1, 1.5, 0.1, red); p.position.set(x, 2.2, z); g.add(p); }
  const reel = new THREE.Group(); reel.position.set(0, 0.9, -2.8);
  const axle = cyl(0.12, 0.12, 3.4, 0x444444, 8); axle.rotation.z = Math.PI / 2; reel.add(axle);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const bl = box(3.3, 0.1, 0.55, 0xf0b400); bl.position.set(0, Math.cos(a) * 0.85, Math.sin(a) * 0.85); bl.rotation.x = a; reel.add(bl); }
  g.add(reel);
  const cutter = box(3.4, 0.2, 0.5, 0xcccccc); cutter.position.set(0, 0.3, -3.0); g.add(cutter);
  const chute = cyl(0.2, 0.2, 1.8, 0xf0b400, 8); chute.position.set(1.2, 2.6, 1.6); chute.rotation.z = -0.9; g.add(chute);
  const pipe = cyl(0.1, 0.12, 1.2, 0x333333, 6); pipe.position.set(-1.2, 2.2, -0.4); g.add(pipe);
  const bonnetLight = lamp(0.18); bonnetLight.position.set(0.9, 1.5, -2.1); g.add(bonnetLight);
  const wheels = [];
  for (const sx of [-1, 1]) { const w = makeWheel(1.0); w.position.set(sx * 1.7, 0, -0.9); g.add(w); wheels.push(w); const w2 = makeWheel(0.6); w2.position.set(sx * 1.6, 0, 1.6); g.add(w2); wheels.push(w2); }
  g.userData.reel = reel; g.userData.wheels = wheels;
  return g;
}

/* ---------- nature & buildings ---------- */
export function makePine(s = 1, snow = false) {
  const g = new THREE.Group();
  const tr = cyl(0.28 * s, 0.4 * s, 1.4 * s, 0x5b3a21, 7); tr.position.y = 0.7 * s; g.add(tr);
  const greens = [0x1f6a38, 0x23783f, 0x2a8a46];
  for (let i = 0; i < 4; i++) {
    const c = cone((1.9 - i * 0.38) * s, 1.8 * s, greens[i % 3], 9); c.position.y = (1.8 + i * 1.05) * s; g.add(c);
    if (snow) { const sn = cone((1.5 - i * 0.34) * s, 0.9 * s, 0xffffff, 9); sn.position.y = (2.25 + i * 1.05) * s; g.add(sn); }
  }
  return g;
}

export function makePalm() {
  const g = new THREE.Group(); const N = 8, H = 8.5, LEAN = 1.6;
  const pt = (t) => new THREE.Vector3(LEAN * t * t, H * t, 0);
  for (let i = 0; i < N; i++) {
    const a = pt(i / N), b = pt((i + 1) / N), d = b.clone().sub(a);
    const seg = cyl(0.26 - 0.15 * (i + 1) / N, 0.3 - 0.15 * i / N, d.length() * 1.04, i % 2 ? 0x8a5a2a : 0x9a6a34, 7);
    seg.position.copy(a.clone().add(b).multiplyScalar(0.5)); seg.rotation.z = -Math.atan2(d.x, d.y); g.add(seg);
  }
  const top = pt(1);
  for (let k = 0; k < 8; k++) {
    const pivot = new THREE.Group(); pivot.position.copy(top); pivot.rotation.y = k / 8 * Math.PI * 2 + 0.2;
    const arm = new THREE.Group(); arm.rotation.z = -0.28 - (k % 2) * 0.12; pivot.add(arm);
    const f1 = box(2.2, 0.07, 0.75, k % 2 ? 0x2f9e4a : 0x3aae56); f1.position.x = 1.1; arm.add(f1);
    const arm2 = new THREE.Group(); arm2.position.x = 2.2; arm2.rotation.z = -0.55; arm.add(arm2);
    const f2 = box(1.9, 0.06, 0.55, 0x2f9e4a); f2.position.x = 0.95; arm2.add(f2);
    const arm3 = new THREE.Group(); arm3.position.x = 1.9; arm3.rotation.z = -0.7; arm2.add(arm3);
    const f3 = cone(0.28, 1.2, 0x2a8a40, 4); f3.rotation.z = -Math.PI / 2; f3.position.x = 0.6; f3.scale.z = 0.4; arm3.add(f3);
    g.add(pivot);
  }
  for (let i = 0; i < 3; i++) { const c = sph(0.24, 0x5a3a1a, 6); c.position.set(top.x + (i - 1) * 0.28, top.y - 0.35, (i % 2 - 0.5) * 0.4); g.add(c); }
  return g;
}

export function makeMushroom(color = 0xd9363e) {
  const g = new THREE.Group();
  const stem = cyl(0.4, 0.55, 2.4, 0xe8dcc0, 10); stem.position.y = 1.2; g.add(stem);
  const cap = sph(1.7, color, 14); cap.scale.set(1, 0.62, 1); cap.position.y = 2.6; g.add(cap);
  const rim = cyl(1.65, 1.65, 0.12, shade(color, 0.8), 14); rim.position.y = 2.45; g.add(rim);
  for (let i = 0; i < 7; i++) { const a = i * 2.4; const sp = sph(0.22, 0xffffff, 6); sp.scale.y = 0.4; sp.position.set(Math.cos(a) * (0.5 + (i % 3) * 0.35), 3.1 + 0.3 - (i % 3) * 0.14, Math.sin(a) * (0.5 + (i % 3) * 0.35)); g.add(sp); }
  return g;
}

const winCache = new Map();
function windowMaterial(color, wCount, hCount) {
  const key = `${color}|${wCount}|${hCount}`;
  if (winCache.has(key)) return winCache.get(key);
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
  const base = new THREE.Color(color); x.fillStyle = '#' + base.getHexString(); x.fillRect(0, 0, 128, 256);
  const cols = 3, rows = 6, pw = 128 / cols, ph = 256 / rows;
  for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
    const lit = ((r * 7 + cc * 3) % 5) < 2; x.fillStyle = lit ? '#ffe9a6' : '#3a5068'; x.fillRect(cc * pw + 8, r * ph + 10, pw - 16, ph - 22);
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(cc * pw + 8, r * ph + ph - 14, pw - 16, 4);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, wCount), Math.max(1, hCount)); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, flatShading: true });
  winCache.set(key, m); return m;
}
export function makeBuilding(w, h, d, color = 0xc9b79c) {
  const g = new THREE.Group(); const cols = Math.max(1, Math.round(w / 4)), rows = Math.max(1, Math.round(h / 4.5)), colsD = Math.max(1, Math.round(d / 4));
  const side = windowMaterial(color, cols, rows), sideD = windowMaterial(color, colsD, rows), plain = mat(shade(color, 0.7));
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideD, sideD, plain, plain, side, side]); b.position.y = h / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
  const cap = box(w + 0.3, 0.4, d + 0.3, shade(color, 0.6)); cap.position.y = h + 0.2; g.add(cap);
  return g;
}

export function makeLampPost(h = 6) {
  const g = new THREE.Group(); const p = cyl(0.1, 0.14, h, 0x444444, 6); p.position.y = h / 2; g.add(p);
  const arm = box(1.0, 0.1, 0.1, 0x444444); arm.position.set(0.45, h, 0); g.add(arm);
  const l = sph(0.34, mat(0xfff0a0, 0xffd860), 8); l.scale.y = 0.7; l.position.set(0.95, h - 0.15, 0); g.add(l);
  return g;
}
