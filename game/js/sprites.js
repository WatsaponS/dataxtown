// ระบบสไปรท์ตัวละครความละเอียดสูง (128x128/เฟรม) — คู่ขนานกับระบบ avatar เดิม (avatar.js,
// CONFIG.frameW/H) ไม่แตะโค้ดเดิมเลย ตัวละครที่ไม่ได้เลือกสไปรท์ใหม่ (ไม่มี ent.spriteId) วิ่ง
// ผ่านเส้นทางเดิมทั้งหมดเหมือนก่อนหน้านี้ทุกประการ
//
// สถาปัตยกรรม (ดู sprites_manifest.js สำหรับ schema เต็ม):
//   sourceFrameWidth/Height — ขนาดจริงต่อเฟรมในไฟล์ภาพต้นฉบับ (ไม่ย่อไฟล์เอง)
//   displayWidth/Height     — ขนาดที่จะวาดจริงบนจอ (world-space px ก่อนคูณ zoom)
//   anchorX/groundAnchorY   — จุดยึด "กึ่งกลางเท้า" ใน source-space (ก่อนสเกล)
//   collisionWidth/Height   — hitbox ชนกำแพง/เฟอร์นิเจอร์ (ดู entities.js moveEntity) แยกอิสระ
//                             จาก display เพื่อไม่ให้เปลี่ยนภาพแล้ว hitbox เพี้ยน
//
// cache รูปภาพ + promise ต่อ id กันโหลดซ้ำ/สร้าง Image ใหม่ทุกเฟรม (ห้ามตาม requirement H)

import { directionIndex } from "./entities.js";
import { getSpriteDef } from "./sprites_manifest.js";

const _cache = new Map(); // id -> { img, promise, ready, failed }

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ img, ok: true });
    img.onerror = () => resolve({ img, ok: false });
    img.src = src;
  });
}

// เรียกล่วงหน้าตอนรู้แล้วว่าจะใช้ id ไหน (เลือกตัวละครตอนสร้าง + NPC ที่มีจริงในฉากเท่านั้น —
// "ห้าม preload ทุกตัวละครในระบบ" ตาม requirement H) คืน promise เดิมถ้าเคยเรียกไปแล้ว
// (ไม่โหลดซ้ำ) resolve เสมอไม่ว่าจะสำเร็จหรือพัง (ไม่ throw — เกมต้องไม่ crash ถ้า asset หาย)
export function preloadSprite(id) {
  const def = getSpriteDef(id);
  if (!def) return Promise.resolve(null);
  let entry = _cache.get(id);
  if (entry) return entry.promise;
  entry = { img: null, ready: false, failed: false, promise: null };
  entry.promise = loadImage(def.image).then(({ img, ok }) => {
    entry.img = img;
    if (ok) entry.ready = true;
    else {
      entry.failed = true;
      console.warn(`โหลดสไปรท์ตัวละคร "${id}" ไม่สำเร็จ (${def.image}) — ใช้ตัวละครเริ่มต้นแทน`);
    }
    return entry;
  });
  _cache.set(id, entry);
  return entry.promise;
}

// คืน HTMLImageElement ถ้าพร้อมวาดแล้ว (โหลดเสร็จและไม่พัง) — null ถ้ายังไม่เสร็จ/พัง/ไม่รู้จัก id
// (caller ใช้เป็นสัญญาณ fallback ไปวาดตัวละครเริ่มต้นแทน ไม่ throw ไม่ crash)
export function getSpriteImage(id) {
  const entry = _cache.get(id);
  return entry && entry.ready ? entry.img : null;
}

function frameIndexFor(ent, def) {
  if (ent.emoteType === "jump" && Date.now() < (ent.emoteUntil || 0)) return 0;
  if (!ent.moving) return 0;
  const cycleMs = (def.frameDurationMs || 140) / (ent.running ? 1.5 : 1);
  return Math.floor((ent.animTime * 1000) / cycleMs) % def.framesPerDirection;
}

// จุดยึด "กึ่งกลางเท้า" ของสไปรท์ id นี้ หลังสเกลเป็น display-space แล้ว (ระยะจากขอบบนภาพถึง
// จุดเท้า) — ให้ render.js ใช้เลื่อนป้ายชื่อ/บับเบิล/อีโมทขึ้นให้พ้นหัว เหมือนที่ outfit.js ทำกับ
// OUTFIT_FRAME_H (ชุดคอสตูมสูงกว่าตัวละครฐาน ป้ายต้องขยับตาม)
export function hiresAnchorHeight(spriteId) {
  const def = getSpriteDef(spriteId);
  if (!def) return null;
  return def.groundAnchorY * (def.displayHeight / def.sourceFrameHeight);
}

// วาดตัวละครความละเอียดสูงแทนตัวละครเดิม — คืน true ถ้าวาดสำเร็จ (ให้ผู้เรียกข้ามการวาด
// avatar เดิม) false ถ้าไม่มี spriteId / ไม่รู้จัก id / รูปยังไม่พร้อม (ผู้เรียกต้อง fallback เอง)
// สูตรตำแหน่งอิงจุดกึ่งกลางเท้า ไม่ใช่มุมบนซ้าย — เปลี่ยนขนาดภาพ (displayWidth/Height) จะไม่ทำให้
// ตำแหน่ง logical x/y ขยับเลย เพราะคำนวณ offset จาก anchor เสมอ
export function drawHiresCharacter(ctx, ent, hop = 0) {
  if (!ent.spriteId) return false;
  const def = getSpriteDef(ent.spriteId);
  if (!def) return false; // id ไม่รู้จัก (เช่น client เก่ากว่า/manifest ไม่ตรงกัน) — fallback เงียบ ๆ
  const img = getSpriteImage(ent.spriteId);
  if (!img) return false; // ยังโหลดไม่เสร็จ หรือโหลดพัง — fallback ไปวาด avatar เดิมแทน

  const dirIdx = directionIndex(ent);
  const frameIdx = frameIndexFor(ent, def);
  const sx = frameIdx * def.sourceFrameWidth;
  const sy = dirIdx * def.sourceFrameHeight;

  const scaleX = def.displayWidth / def.sourceFrameWidth;
  const scaleY = def.displayHeight / def.sourceFrameHeight;
  const anchorDisplayX = def.anchorX * scaleX;
  const anchorDisplayY = def.groundAnchorY * scaleY;

  const dx = Math.round(ent.x - anchorDisplayX);
  const dy = Math.round(ent.y - anchorDisplayY - hop);

  ctx.drawImage(
    img,
    sx, sy, def.sourceFrameWidth, def.sourceFrameHeight,
    dx, dy, def.displayWidth, def.displayHeight,
  );
  return true;
}

// ---------- พรีวิวหน้าสร้างตัวละคร (section E) ----------
// contain-fit ลง canvas ขนาด boxW x boxH โดยรักษาสัดส่วนเสมอ (ห้าม stretch/บีบ) ยึดตำแหน่งจาก
// ground anchor เหมือนกันกับตอนวาดในเกมจริง (ไม่ใช่แค่กึ่งกลางกล่องเฉย ๆ)
export function drawSpritePreview(ctx, canvas, spriteId, dir = "down") {
  const def = getSpriteDef(spriteId);
  const img = getSpriteImage(spriteId);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!def || !img) return false;
  const boxW = canvas.width, boxH = canvas.height;
  const MARGIN = 0.92; // เผื่อขอบเล็กน้อยกันชนขอบกล่องพอดีเป๊ะ
  const scale = Math.min(boxW / def.sourceFrameWidth, boxH / def.sourceFrameHeight) * MARGIN;
  const dirIdx = Math.max(0, def.directions.indexOf(dir));
  const sx = 0, sy = dirIdx * def.sourceFrameHeight; // เฟรมนิ่ง (frame 0) พอสำหรับพรีวิว
  const drawW = def.sourceFrameWidth * scale, drawH = def.sourceFrameHeight * scale;
  const dx = boxW / 2 - def.anchorX * scale;
  const dy = boxH * 0.9 - def.groundAnchorY * scale;
  ctx.drawImage(img, sx, sy, def.sourceFrameWidth, def.sourceFrameHeight, dx, dy, drawW, drawH);
  return true;
}
