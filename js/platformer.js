import {
  THREE, isDown, wasHit, box, cyl, sph, mat, mesh, addLights, followSun,
  makeHare, animateLimbs, lerpAngle, damp, clamp,
} from './common.js';
import { sfx } from './audio.js';
import { ui } from './ui.js';

const R = 0.35;   // player radius
const H = 1.6;    // player height
const SPEED = 7.2;
const GRAV = 30;
const JUMP = 11.6;

/**
 * Data-driven 3D platformer.
 * Platform positions: x,y,z is the TOP-CENTRE of the platform.
 */
export class Platformer {
  constructor(ctx, cfg) {
    this.ctx = ctx; this.cfg = cfg;
    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(cfg.sky);
    scene.fog = new THREE.Fog(cfg.fog ?? cfg.sky, 45, 140);
    this.sun = addLights(scene, cfg.light);
    this.t = 0;

    this.platforms = cfg.platforms.map((d) => this.addPlatform(d));
    this.hazards = (cfg.hazards || []).map((h) => this.addHazard(h));
    this.tickets = (cfg.tickets || []).map((p) => {
      const m = box(0.8, 0.5, 0.12, mat(0xffc933, 0x664400));
      const stub = box(0.2, 0.5, 0.14, 0xe55a2b); stub.position.x = 0.3; m.add(stub);
      m.position.set(...p); scene.add(m);
      return { mesh: m, got: false, base: p[1] };
    });
    this.got = 0;

    // goal
    const g = cfg.goal;
    this.goalPos = new THREE.Vector3(...g.pos);
    const gm = new THREE.Group();
    const ring = mesh(new THREE.TorusGeometry(1.3, 0.14, 8, 24), mat(0x52e08a, 0x1a7a40)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1;
    const beam = cyl(1.2, 1.2, 6, mat(0x7dffb0, 0x2faa60, { transparent: true, opacity: 0.22 }), 20); beam.position.y = 3; beam.castShadow = false;
    gm.add(ring, beam); gm.position.copy(this.goalPos); scene.add(gm);
    this.goalMesh = gm;

    // player
    this.hare = makeHare(); scene.add(this.hare);
    this.pos = new THREE.Vector3(...cfg.spawn);
    this.vel = new THREE.Vector3();
    this.checkpoint = this.pos.clone();
    this.grounded = false; this.ground = null; this.coyote = 0; this.jumpBuf = 0; this.jumps = 0;
    this.face = Math.PI; this.invuln = 0.6; this.oops = 0; this.runPhase = 0;
    this.camYaw = cfg.camYaw ?? 0;
    this.msgT = 0; this.done = false;

    this.tick = cfg.build ? cfg.build(scene, this) : null;
    this.updateHud();
    this.placeCamera(true);
  }

  addPlatform(d) {
    const w = d.w, h = d.h ?? 0.5, dp = d.d ?? 4;
    const color = d.color ?? (d.move ? (this.cfg.moverColor ?? 0xe0b030) : (this.cfg.platformColor ?? 0x8a6d4b));
    const m = box(w, h, dp, color);
    this.scene.add(m);
    const pl = {
      mesh: m, w, h, d: dp, move: d.move, cp: !!d.cp, cpDone: false,
      base: new THREE.Vector3(d.x, d.y, d.z ?? 0), cur: new THREE.Vector3(), delta: new THREE.Vector3(),
    };
    pl.cur.copy(pl.base);
    this.placePlatform(pl, 0, true);
    return pl;
  }

  placePlatform(pl, t, init) {
    const prev = pl.cur.clone();
    pl.cur.copy(pl.base);
    if (pl.move) {
      pl.cur[pl.move.axis] += Math.sin(t * pl.move.speed + (pl.move.phase || 0)) * pl.move.range;
    }
    if (init) pl.delta.set(0, 0, 0); else pl.delta.copy(pl.cur).sub(prev);
    pl.mesh.position.set(pl.cur.x, pl.cur.y - pl.h / 2, pl.cur.z);
    pl.minx = pl.cur.x - pl.w / 2; pl.maxx = pl.cur.x + pl.w / 2;
    pl.minz = pl.cur.z - pl.d / 2; pl.maxz = pl.cur.z + pl.d / 2;
    pl.maxy = pl.cur.y; pl.miny = pl.cur.y - pl.h;
  }

  addHazard(h) {
    const o = { ...h, r: h.r ?? 0.6, pos: new THREE.Vector3() };
    if (h.type === 'pendulum') {
      const g = new THREE.Group();
      g.position.set(...h.pivot);
      const rope = cyl(0.05, 0.05, h.len, 0x444444, 6); rope.position.y = -h.len / 2;
      const ball = sph(o.r, h.color ?? 0x3b3b44, 16); ball.position.y = -h.len;
      g.add(rope, ball);
      this.scene.add(g); o.group = g;
    } else {
      const m = sph(o.r, h.color ?? 0xc0392b, 14);
      this.scene.add(m); o.mesh = m;
    }
    return o;
  }

  updateHazards(t) {
    for (const h of this.hazards) {
      if (h.type === 'pendulum') {
        const a = (h.amp ?? 0.8) * Math.sin(t * (h.speed ?? 1.8) + (h.phase || 0));
        const [px, py, pz] = h.pivot;
        if (h.axis === 'z') {
          h.group.rotation.set(-a, 0, 0);
          h.pos.set(px, py - Math.cos(a) * h.len, pz + Math.sin(a) * h.len);
        } else {
          h.group.rotation.set(0, 0, a);
          h.pos.set(px + Math.sin(a) * h.len, py - Math.cos(a) * h.len, pz);
        }
      } else {
        const k = (Math.sin(t * (h.speed ?? 1) + (h.phase || 0)) + 1) / 2;
        h.pos.set(
          h.from[0] + (h.to[0] - h.from[0]) * k,
          h.from[1] + (h.to[1] - h.from[1]) * k,
          h.from[2] + (h.to[2] - h.from[2]) * k,
        );
        h.mesh.position.copy(h.pos);
        h.mesh.rotation.x += 0.1;
      }
    }
  }

  updateHud() {
    const need = this.cfg.goal.need ?? 0;
    let s = '';
    if (need) s += `🎟 Tickets <b>${this.got}/${need}</b> &nbsp; `;
    s += `💫 Oops <b>${this.oops}</b>`;
    ui.info(s);
  }

  respawn(msg) {
    this.pos.copy(this.checkpoint);
    this.vel.set(0, 0, 0);
    this.invuln = 1.2; this.oops++;
    this.updateHud();
    ui.toast(msg);
    sfx.hit();
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.t += dt; const t = this.t;
    this.invuln = Math.max(0, this.invuln - dt);
    this.msgT = Math.max(0, this.msgT - dt);

    for (const pl of this.platforms) this.placePlatform(pl, t, false);
    this.updateHazards(t);
    if (this.tick) this.tick(t, this);

    this.movePlayer(dt);

    // hazards
    const c = this.pos.clone(); c.y += 0.8;
    if (this.invuln <= 0) {
      for (const h of this.hazards) {
        if (h.pos.distanceTo(c) < h.r + 0.45) { this.respawn(this.cfg.hitMsg ?? 'Oops! Back to the checkpoint!'); break; }
      }
    }
    if (this.pos.y < (this.cfg.killY ?? -15)) this.respawn('Aaah! Splat... try again!');

    // tickets
    for (const k of this.tickets) {
      k.mesh.rotation.y += dt * 2.5;
      k.mesh.position.y = k.base + Math.sin(t * 3 + k.base) * 0.12;
      if (!k.got && k.mesh.position.distanceTo(c) < 1.1) {
        k.got = true; k.mesh.visible = false; this.got++; this.updateHud(); sfx.coin();
        ui.toast(`Golden ticket! ${this.got}/${this.cfg.goal.need}`);
      }
    }

    // goal
    this.goalMesh.rotation.y += dt;
    const dx = this.pos.x - this.goalPos.x, dz = this.pos.z - this.goalPos.z;
    if (!this.done && Math.hypot(dx, dz) < 1.6 && Math.abs(this.pos.y - this.goalPos.y) < 2.5) {
      if (this.got >= (this.cfg.goal.need ?? 0)) {
        this.done = true;
        this.ctx.win();
      } else if (this.msgT <= 0) {
        ui.toast(`You need all ${this.cfg.goal.need} golden tickets first!`);
        this.msgT = 2.5;
      }
    }

    this.animate(dt);
    this.placeCamera(false, dt);
    followSun(this.sun, this.pos);
  }

  movePlayer(dt) {
    // camera rotation
    if (isDown('KeyQ')) this.camYaw += 1.7 * dt;
    if (isDown('KeyE')) this.camYaw -= 1.7 * dt;

    const ix = (isDown('KeyD', 'ArrowRight') ? 1 : 0) - (isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const iz = (isDown('KeyS', 'ArrowDown') ? 1 : 0) - (isDown('KeyW', 'ArrowUp') ? 1 : 0);
    const s = Math.sin(this.camYaw), c = Math.cos(this.camYaw);
    // right = (c, -s), forward = (-s, -c)
    let dx = c * ix + s * iz, dz = -s * ix + c * iz;
    const len = Math.hypot(dx, dz);
    if (len > 0) { dx /= len; dz /= len; }
    const k = damp(this.grounded ? 20 : 7, dt);
    this.vel.x += (dx * SPEED - this.vel.x) * k;
    this.vel.z += (dz * SPEED - this.vel.z) * k;
    this.moving = len > 0;
    if (len > 0) this.face = lerpAngle(this.face, Math.atan2(dx, dz), damp(16, dt));

    // carried by platform
    if (this.ground) this.pos.add(this.ground.delta);

    // jump
    if (wasHit('Space')) this.jumpBuf = 0.14;
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    if (this.jumpBuf > 0) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = JUMP; this.jumps = 1; this.coyote = 0; this.jumpBuf = 0; this.grounded = false; this.ground = null; sfx.jump();
      } else if (this.jumps < 2) {
        this.vel.y = JUMP * 0.92; this.jumps = 2; this.jumpBuf = 0; sfx.air();
      }
    }
    if (!isDown('Space') && this.vel.y > 5) this.vel.y -= 38 * dt; // variable jump height

    this.vel.y = Math.max(-32, this.vel.y - GRAV * dt);

    // --- Y ---
    const prevY = this.pos.y;
    this.pos.y += this.vel.y * dt;
    const wasGround = this.grounded;
    this.grounded = false; this.ground = null;
    for (const pl of this.platforms) {
      if (Math.abs(this.pos.x - pl.cur.x) >= pl.w / 2 + R * 0.8 || Math.abs(this.pos.z - pl.cur.z) >= pl.d / 2 + R * 0.8) continue;
      if (!(this.pos.y < pl.maxy && this.pos.y + H > pl.miny)) continue;
      if (this.vel.y <= 0 && prevY >= pl.maxy - 0.4) {
        this.pos.y = pl.maxy; this.vel.y = 0; this.grounded = true; this.ground = pl;
      } else if (this.vel.y > 0 && prevY + H <= pl.miny + 0.4) {
        this.pos.y = pl.miny - H; this.vel.y = 0;
      }
    }
    if (this.grounded) {
      this.coyote = 0.11; this.jumps = 0;
      const pl = this.ground;
      if (pl.cp && !pl.cpDone) {
        pl.cpDone = true;
        this.checkpoint.set(pl.cur.x, pl.cur.y + 0.05, pl.cur.z);
        ui.toast('Checkpoint!', 1200); sfx.pop();
      }
    } else if (wasGround && this.vel.y <= 0 && this.coyote <= 0) {
      // walked off a ledge
    }
    if (!this.grounded && this.coyote <= 0 && this.jumps === 0) this.jumps = 1;

    // --- X / Z ---
    this.pos.x += this.vel.x * dt; this.resolveH('x');
    this.pos.z += this.vel.z * dt; this.resolveH('z');
  }

  resolveH(axis) {
    for (const pl of this.platforms) {
      if (!(this.pos.y < pl.maxy - 0.12 && this.pos.y + H > pl.miny + 0.12)) continue;
      const ox = Math.abs(this.pos.x - pl.cur.x) < pl.w / 2 + R - 0.004;
      const oz = Math.abs(this.pos.z - pl.cur.z) < pl.d / 2 + R - 0.004;
      if (!(ox && oz)) continue;
      if (axis === 'x') {
        this.pos.x = (this.pos.x < pl.cur.x) ? pl.minx - R : pl.maxx + R; this.vel.x = 0;
      } else {
        this.pos.z = (this.pos.z < pl.cur.z) ? pl.minz - R : pl.maxz + R; this.vel.z = 0;
      }
    }
  }

  animate(dt) {
    const h = this.hare;
    h.position.copy(this.pos);
    h.rotation.y = this.face;
    h.visible = this.invuln <= 0 || Math.floor(this.t * 14) % 2 === 0;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    this.runPhase += dt * (6 + sp * 1.4);
    animateLimbs(h, this.runPhase, clamp(sp / SPEED, 0, 1) * 0.9, !this.grounded);
    const squash = this.grounded ? 1 + Math.sin(this.runPhase * 2) * 0.02 * (sp > 1 ? 1 : 0) : 1.04;
    h.scale.y = squash;
  }

  placeCamera(snap, dt = 0) {
    const s = Math.sin(this.camYaw), c = Math.cos(this.camYaw);
    const target = this.pos.clone(); target.y += 1.3;
    const want = new THREE.Vector3(target.x + s * 9.5, target.y + 5.2, target.z + c * 9.5);
    const cam = this.ctx.camera;
    if (snap) cam.position.copy(want); else cam.position.lerp(want, damp(6, dt));
    cam.lookAt(target.x, target.y + 0.2, target.z);
  }
}
