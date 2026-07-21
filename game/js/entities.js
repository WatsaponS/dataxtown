// Entity = ผู้เล่น / NPC / (อนาคต: remote player) — ตำแหน่ง (x,y) คือจุดกึ่งกลางเท้า

import { boxBlocked, zoneAt } from "./world.js";
import { PRIVATE_ZONE_TYPES } from "./data.js";

const DIRS = ["down", "left", "right", "up"];

export function makeEntity({ id, name, role = "", variant = 0, x, y, kind = "npc" }) {
  return {
    id, name, role, variant, x, y, kind,
    dir: "down", moving: false, animTime: 0,
    bubble: null,               // { text, until }
    // สำหรับ NPC
    state: "idle", stateTimer: 1 + Math.random() * 2,
    vx: 0, vy: 0, home: [x, y], roam: 4, lines: [], speakCooldown: 5,
  };
}

// ขยับ entity แยกแกน X/Y เพื่อให้ slide ตามกำแพงได้ — คืนค่าว่าขยับได้จริงไหม
export function moveEntity(world, ent, dx, dy) {
  const HW = 5, FOOT = 5; // hitbox ครึ่งกว้าง 5px, สูงช่วงเท้า 5px
  let movedX = false, movedY = false;
  if (dx !== 0) {
    const nx = ent.x + dx;
    if (!boxBlocked(world, nx - HW, ent.y - FOOT, nx + HW, ent.y - 1)) { ent.x = nx; movedX = true; }
  }
  if (dy !== 0) {
    const ny = ent.y + dy;
    if (!boxBlocked(world, ent.x - HW, ny - FOOT, ent.x + HW, ny - 1)) { ent.y = ny; movedY = true; }
  }
  return movedX || movedY;
}

// controls = { keys: Set<KeyboardEvent.code>, joy: {x, y, active} } — joy มาจาก virtual joystick บนจอสัมผัส
export function updatePlayer(world, controls, dt) {
  const p = world.player;
  const cfg = world.config;
  const keys = controls.keys;
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

  let run = keys.has("ShiftLeft") || keys.has("ShiftRight");
  if (controls.joy && controls.joy.active) {
    dx = controls.joy.x; dy = controls.joy.y;
    if (Math.hypot(dx, dy) > 0.9) run = true; // ดันสุดขอบ = วิ่ง
  }

  const mag = Math.hypot(dx, dy);
  p.moving = mag > 0.15;
  p.running = p.moving && run;
  if (p.moving) {
    if (mag > 1) { dx /= mag; dy /= mag; }
    const speed = cfg.walkSpeed * (run ? cfg.runMultiplier : 1);
    moveEntity(world, p, dx * speed * dt, dy * speed * dt);
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    p.animTime += dt;
  }
}

export function updateNPC(world, npc, dt) {
  npc.stateTimer -= dt;
  npc.speakCooldown -= dt;

  if (npc.state === "idle") {
    npc.moving = false;
    if (npc.stateTimer <= 0) {
      // เลือกทิศใหม่ แต่ไม่ออกนอกรัศมี roam จาก home
      const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      const a = angles[Math.floor(Math.random() * 4)];
      npc.vx = Math.cos(a); npc.vy = Math.sin(a);
      const t = world.tile;
      const aheadX = npc.x + npc.vx * t * 2, aheadY = npc.y + npc.vy * t * 2;
      const far = Math.hypot(aheadX - npc.home[0], aheadY - npc.home[1]) > npc.roam * t;
      if (far) { // หันกลับเข้าหา home แทน
        const back = Math.atan2(npc.home[1] - npc.y, npc.home[0] - npc.x);
        npc.vx = Math.abs(Math.cos(back)) > Math.abs(Math.sin(back)) ? Math.sign(Math.cos(back)) : 0;
        npc.vy = npc.vx === 0 ? Math.sign(Math.sin(back)) : 0;
      }
      npc.state = "walk";
      npc.stateTimer = 0.6 + Math.random() * 1.4;
    }
  } else { // walk
    npc.moving = true;
    npc.animTime += dt;
    const speed = world.config.walkSpeed * 0.5;
    const ok = moveEntity(world, npc, npc.vx * speed * dt, npc.vy * speed * dt);
    npc.dir = Math.abs(npc.vx) >= Math.abs(npc.vy) ? (npc.vx < 0 ? "left" : "right") : (npc.vy < 0 ? "up" : "down");
    if (!ok || npc.stateTimer <= 0) {
      npc.state = "idle";
      npc.stateTimer = 1.5 + Math.random() * 3;
    }
  }

  // ทักผู้เล่นเมื่อเข้าใกล้ (ใช้กติกาได้ยินเดียวกับแชต)
  const p = world.player;
  if (p && npc.lines.length && npc.speakCooldown <= 0 && canHear(world, p, npc)) {
    if (Math.random() < 0.4) {
      speak(world, npc, npc.lines[Math.floor(Math.random() * npc.lines.length)]);
      npc.speakCooldown = 14 + Math.random() * 10;
    } else {
      npc.speakCooldown = 3;
    }
  }
}

export function speak(world, ent, text) {
  ent.bubble = { text, until: world.time + world.config.bubbleSeconds };
  if (world.onChat) world.onChat(ent, text);
}

// กติกา "ได้ยินกัน" แบบ Gather Town: โซนส่วนตัว > ระยะห่าง
export function canHear(world, a, b) {
  if (a === b) return true;
  const za = zoneAt(world, a.x, a.y), zb = zoneAt(world, b.x, b.y);
  const priv = z => z && PRIVATE_ZONE_TYPES.has(z.type);
  if (priv(za) || priv(zb)) return za && zb && za.id === zb.id;
  return Math.hypot(a.x - b.x, a.y - b.y) <= world.config.proximityRadius;
}

// เฟรมต่อทิศ: สไปรท์ใหม่ (office-avatar-sprites) มี 4 เฟรมเดิน/ทิศ ไม่มีท่าวิ่ง/กระโดดแยก —
// ยืนเฉย = เฟรม 0 นิ่ง, เดิน/วิ่ง = ไล่ครบ 4 เฟรมเดิม (วิ่งแค่ไล่เร็วกว่า), กระโดด = เฟรม 0
// + เด้งตัวแนวตั้งใน render.js (ดู ent.emoteType==="jump")
export const FRAMES_PER_DIR = 4;

export function spriteFrame(ent) {
  const di = DIRS.indexOf(ent.dir);
  let f = 0;
  if (ent.emoteType === "jump" && Date.now() < (ent.emoteUntil || 0)) {
    f = 0;
  } else if (ent.moving) {
    const cycleSpeed = ent.running ? 12 : 8;
    f = Math.floor(ent.animTime * cycleSpeed) % FRAMES_PER_DIR;
  }
  return di * FRAMES_PER_DIR + f;
}
