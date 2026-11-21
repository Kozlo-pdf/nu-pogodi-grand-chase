import {
  THREE, box, cyl, sph, cone, mat, mesh, addLights, followSun,
  makeHare, makeWolf, animateLimbs, damp,
} from './common.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const LINES = [
  '♪ Let the sleigh bells ring… ♪',
  '♪ Let the whole wide world sing along… ♪',
  '♪ Happy New Year, everyone! ♪',
  '"Nu, zayats, nu, pogodi!"',
];

/** New Year's Eve at the resort: giant tree, crowd, fireworks and a very tangled Wolf. */
export class Ending {
  constructor(ctx) {
    this.ctx = ctx;
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1233);
    scene.fog = new THREE.Fog(0x0b1233, 50, 160);
    this.sun = addLights(scene, { sky: 0x8aa0ff, ground: 0x223355, sun: 0xaab8ff, intensity: 0.7, hemi: 0.9 });
    followSun(this.sun, new THREE.Vector3(0, 0, 0));

    const snow = box(200, 1, 200, 0xe9f1fb); snow.position.y = -0.5; scene.add(snow);
    // stage
    const stage = box(14, 1, 7, 0xb02a3a); stage.position.set(0, 0.5, 4); scene.add(stage);
    // tree
    const tree = this.tree = new THREE.Group();
    const trunk = cyl(0.8, 1, 3, 0x5b3a21, 10); trunk.position.y = 1.5; tree.add(trunk);
    for (let i = 0; i < 5; i++) { const c = cone(6.5 - i * 1.15, 5, 0x1f7a3a, 14); c.position.y = 4.5 + i * 3.2; tree.add(c); }
    const star = sph(0.9, mat(0xffe14d, 0xaa8800), 8); star.position.y = 21.5; tree.add(star);
    this.bulbs = [];
    for (let i = 0; i < 70; i++) {
      const y = 3 + (i / 70) * 16, rad = Math.max(0.5, 6.6 - (y - 3) * 0.37);
      const a = i * 2.4;
      const b = sph(0.22, mat(0xffffff, 0x444444), 6); b.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); tree.add(b); this.bulbs.push(b);
    }
    tree.position.set(0, 0, -14); scene.add(tree);

    // wolf on top
    this.wolf = makeWolf({ scale: 1.4 }); this.wolf.position.set(0, 21, -13); this.wolf.rotation.set(0.4, 0, 0.3); scene.add(this.wolf);
    // hare on stage
    this.hare = makeHare(); this.hare.position.set(0, 1, 5); this.hare.rotation.y = 0; this.hare.scale.setScalar(1.3); scene.add(this.hare);
    // crowd
    this.crowd = [];
    for (let i = 0; i < 46; i++) {
      const g = new THREE.Group();
      const body = mesh(new THREE.CapsuleGeometry(0.35, 0.5, 4, 8), [0xe23a3a, 0x3a7be2, 0x3ac26a, 0xe2b13a, 0xa23ae2][i % 5]);
      body.position.y = 0.9; const head = sph(0.3, 0xf2c9a0, 8); head.position.y = 1.65; g.add(body, head);
      const a = -Math.PI * 0.95 + (i / 46) * Math.PI * 0.9 * 2;
      const r = 8 + (i % 4) * 2.2;
      g.position.set(Math.sin(a) * r, 0, 14 + Math.cos(a) * 3 + (i % 4) * 2);
      g.rotation.y = Math.PI; scene.add(g); this.crowd.push(g);
    }

    this.bursts = []; this.nextBurst = 0.2; this.t = 0; this.line = -1; this.ended = false;
    ui.info('🎆 Happy New Year!');
    this.update(0.001);
  }

  burst() {
    const n = 70, geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    const cx = (Math.random() - 0.5) * 50, cy = 18 + Math.random() * 14, cz = -22 - Math.random() * 10;
    for (let i = 0; i < n; i++) {
      pos[i * 3] = cx; pos[i * 3 + 1] = cy; pos[i * 3 + 2] = cz;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = 6 + Math.random() * 4;
      vel[i * 3] = Math.sin(ph) * Math.cos(th) * s; vel[i * 3 + 1] = Math.cos(ph) * s; vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * s;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const col = new THREE.Color().setHSL(Math.random(), 1, 0.6);
    const m = new THREE.PointsMaterial({ color: col, size: 0.55, transparent: true, opacity: 1, depthWrite: false });
    const pts = new THREE.Points(geo, m); pts.frustumCulled = false;
    this.scene.add(pts); this.bursts.push({ pts, vel, age: 0 }); sfx.pop();
  }

  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt; const t = this.t;
    this.nextBurst -= dt;
    if (this.nextBurst <= 0) { this.burst(); this.nextBurst = 0.35 + Math.random() * 0.5; }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]; b.age += dt;
      const p = b.pts.geometry.attributes.position;
      for (let k = 0; k < p.count; k++) {
        b.vel[k * 3 + 1] -= 5 * dt;
        p.array[k * 3] += b.vel[k * 3] * dt; p.array[k * 3 + 1] += b.vel[k * 3 + 1] * dt; p.array[k * 3 + 2] += b.vel[k * 3 + 2] * dt;
      }
      p.needsUpdate = true; b.pts.material.opacity = Math.max(0, 1 - b.age / 2);
      if (b.age > 2) { this.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); this.bursts.splice(i, 1); }
    }
    this.bulbs.forEach((b, i) => { b.material = mat([0xff4455, 0xffdd44, 0x55ddff, 0x66ff88][(i + Math.floor(t * 4)) % 4], 0x777777); });
    this.crowd.forEach((c, i) => { c.position.y = Math.abs(Math.sin(t * 5 + i)) * 0.35; });
    this.hare.position.y = 1 + Math.abs(Math.sin(t * 3)) * 0.15;
    animateLimbs(this.hare, t * 4, 0.3);
    this.hare.userData.armR.rotation.x = -2.6 + Math.sin(t * 6) * 0.3;
    this.wolf.rotation.z = 0.3 + Math.sin(t * 3) * 0.05;
    this.wolf.userData.armL.rotation.x = -2.4 + Math.sin(t * 9) * 0.5;

    const cam = this.ctx.camera;
    cam.position.set(Math.sin(t * 0.15) * 6, 5 + Math.sin(t * 0.2) * 1, 19);
    cam.lookAt(0, 9, -4);

    const li = Math.min(LINES.length - 1, Math.floor(t / 5));
    if (li !== this.line) { this.line = li; ui.toast(LINES[li], 4800); }
    if (t > 22 && !this.ended) { this.ended = true; this.ctx.win(); }
  }
}
