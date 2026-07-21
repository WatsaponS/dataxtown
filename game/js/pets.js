// สัตว์เลี้ยงเดินตามเจ้าของ — ใช้ "trail" (เส้นทางที่เจ้าของเคยเดินผ่าน) แทน pathfinding:
// สัตว์เดินตามจุดบนเส้นทางที่ห่างจากเจ้าของปัจจุบันไปทางท้ายเส้นตามระยะที่กำหนด (lag)
// ข้อดี: เดินตามได้โดยไม่มีทางชนกำแพง เพราะเจ้าของเดินผ่านช่องเดินได้จริงมาแล้วเสมอ

import { PET_FRAME, petFrameRow } from "./pets_data.js";

const LAG_DIST = 60;        // px — ระยะห่างจากเจ้าของตามเส้นทาง (2x จาก 30 — ตาม tile 24->48px)
const SAMPLE_MIN_DIST = 10; // px — บันทึกจุดใหม่เมื่อเจ้าของขยับเกินนี้ (2x จาก 5)
const TRAIL_MAX = 80;       // จุดสูงสุดที่เก็บ (เกินพอสำหรับ LAG_DIST เสมอ)
const CATCH_UP = 6;         // ยิ่งมากยิ่งตามเจ้าของติดขึ้น (หน่วย 1/วินาที)
const TELEPORT_DIST = 400;  // ไกลผิดปกติ (เพิ่งเลือกสัตว์/สลับแผนที่) ให้กระโดดไปเลย (2x จาก 200)

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

// สไปรท์สัตว์เลี้ยงไม่ได้ขยายไฟล์จริง — วาดขยาย 2x ตอน render ในโลกเกมเท่านั้น (ตัวเลือกใน
// character-creation ยังใช้ขนาดเดิม) ให้สัดส่วนตรงกับแผนที่/ตัวละครที่ใหญ่ขึ้น (tile 24->48px)
const PET_DRAW_SCALE = 2;

export function drawPet(ctx, ent) {
  const img = petImg;
  if (!img || !img.complete || !ent.pet) return;
  const row = petFrameRow(ent.petId, ent.pet.dir);
  if (row < 0) return;
  const col = ent.pet.moving ? (Math.floor(ent.pet.animTime * 7) % 4) : 0;
  const size = PET_FRAME, dsize = size * PET_DRAW_SCALE;
  const dx = Math.round(ent.pet.x - dsize / 2), dy = Math.round(ent.pet.y - dsize + 6);
  // เงาอิงสัดส่วนตัวสัตว์จริง (แบบเดียวกับเงาผู้เล่นใน render.js ที่ใช้ frameW*0.62) — ก่อนหน้านี้
  // เป็นความกว้างคงที่ dsize-8 ที่ตั้งไว้ตอนสไปรท์ยังเล็ก (16px) พอสไปรท์ใหญ่ขึ้นเป็น 32px
  // ความกว้างเดิมเลยกลายเป็นแท่งเทาใหญ่เกินตัวสัตว์จนดูเหมือนเส้นขอบแปลก ๆ ใต้เท้า
  const shadowW = Math.round(dsize * 0.5), shadowH = Math.max(2, Math.round(dsize * 0.06));
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(Math.round(ent.pet.x - shadowW / 2), Math.round(ent.pet.y) - 2, shadowW, shadowH);
  ctx.drawImage(img, col * size, row * size, size, size, dx, dy, dsize, dsize);
}
