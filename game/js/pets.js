// สัตว์เลี้ยงเดินตามเจ้าของ — ใช้ "trail" (เส้นทางที่เจ้าของเคยเดินผ่าน) แทน pathfinding:
// สัตว์เดินตามจุดบนเส้นทางที่ห่างจากเจ้าของปัจจุบันไปทางท้ายเส้นตามระยะที่กำหนด (lag)
// ข้อดี: เดินตามได้โดยไม่มีทางชนกำแพง เพราะเจ้าของเดินผ่านช่องเดินได้จริงมาแล้วเสมอ

import { PET_FRAME, petIndexOf } from "./pets_data.js";

const LAG_DIST = 30;        // px — ระยะห่างจากเจ้าของตามเส้นทาง
const SAMPLE_MIN_DIST = 5;  // px — บันทึกจุดใหม่เมื่อเจ้าของขยับเกินนี้
const TRAIL_MAX = 80;       // จุดสูงสุดที่เก็บ (เกินพอสำหรับ LAG_DIST เสมอ)
const CATCH_UP = 6;         // ยิ่งมากยิ่งตามเจ้าของติดขึ้น (หน่วย 1/วินาที)
const TELEPORT_DIST = 200;  // ไกลผิดปกติ (เพิ่งเลือกสัตว์/สลับแผนที่) ให้กระโดดไปเลย

let petImg = null;
export function loadPetImage() {
  if (!petImg) {
    petImg = new Image();
    petImg.src = "assets/pets.png";
  }
  return petImg;
}
export function petImageEl() { return petImg; } // ให้โมดูลอื่น (decor.js) ใช้ sheet เดียวกัน

// เรียกตอนกำหนด/เปลี่ยนสัตว์เลี้ยงให้ entity (ผู้เล่นหรือ remote) — เปลี่ยนชนิดจะรีเซ็ต trail,
// แต่แค่เปลี่ยนชื่อ (petId เดิม) จะไม่รีเซ็ตตำแหน่ง/เส้นทางที่กำลังเดินตามอยู่
export function setPet(ent, petId, petName) {
  const speciesChanged = ent.petId !== (petId || null);
  ent.petId = petId || null;
  ent.petName = petId ? (petName || null) : null;
  if (!ent.petId) { ent.pet = null; return; }
  if (speciesChanged || !ent.pet) {
    ent.pet = {
      x: ent.x, y: ent.y, dir: ent.dir || "down", moving: false, animTime: 0,
      trail: [{ x: ent.x, y: ent.y }],
    };
  }
}

export function updatePets(world, dt) {
  for (const ent of world.entities) {
    if (!ent.petId || !ent.pet) continue;
    const pet = ent.pet;

    // บันทึกเส้นทางของเจ้าของ (sample ตามระยะ กันจุดถี่เกินไป)
    const trail = pet.trail;
    const last = trail[trail.length - 1];
    if (Math.hypot(ent.x - last.x, ent.y - last.y) >= SAMPLE_MIN_DIST) {
      trail.push({ x: ent.x, y: ent.y });
      if (trail.length > TRAIL_MAX) trail.shift();
    }

    // หาจุดเป้าหมายบนเส้นทาง: เดินย้อนจากปลาย (เจ้าของ) สะสมระยะจนถึง LAG_DIST
    let target = { x: ent.x, y: ent.y };
    let acc = 0;
    for (let i = trail.length - 1; i > 0; i--) {
      const a = trail[i], b = trail[i - 1];
      const seg = Math.hypot(a.x - b.x, a.y - b.y);
      if (acc + seg >= LAG_DIST) {
        const t = seg > 0 ? (LAG_DIST - acc) / seg : 0;
        target = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        break;
      }
      acc += seg;
      target = b;
    }

    const dx = target.x - pet.x, dy = target.y - pet.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TELEPORT_DIST) {
      pet.x = target.x; pet.y = target.y;
      pet.moving = false;
    } else if (dist > 1) {
      const k = Math.min(1, dt * CATCH_UP);
      pet.x += dx * k; pet.y += dy * k;
      pet.moving = dist > 2;
      if (Math.abs(dx) > Math.abs(dy)) pet.dir = dx < 0 ? "left" : "right";
      else pet.dir = dy < 0 ? "up" : "down";
    } else {
      pet.moving = false;
    }
    if (pet.moving) pet.animTime += dt;
  }
}

const DIR_FLIP = { left: false, right: true, up: false, down: false }; // sprite หันซ้ายเป็นค่าเริ่มต้น

export function drawPet(ctx, ent) {
  const img = petImg;
  if (!img || !img.complete || !ent.pet) return;
  const idx = petIndexOf(ent.petId);
  if (idx < 0) return;
  const col = ent.pet.moving ? (Math.floor(ent.pet.animTime * 6) % 2) : 0;
  const flip = DIR_FLIP[ent.pet.dir];
  const size = PET_FRAME;
  const dx = Math.round(ent.pet.x - size / 2), dy = Math.round(ent.pet.y - size + 3);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(dx + 2, Math.round(ent.pet.y) - 1, size - 4, 2);
  if (flip) {
    ctx.save();
    ctx.translate(dx + size, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, col * size, idx * size, size, size, 0, 0, size, size);
    ctx.restore();
  } else {
    ctx.drawImage(img, col * size, idx * size, size, size, dx, dy, size, size);
  }
}
