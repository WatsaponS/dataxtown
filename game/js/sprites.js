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
import { applyMaskRecolor } from "./avatar.js";

const _cache = new Map(); // id -> { img, promise, ready, failed, hairMaskImg, clothingMaskImg }
const _customCache = new Map(); // `${id}|${hair}|${shirt}` -> HTMLCanvasElement (recolored whole sheet)

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
// ถ้า def มี hairMask/clothingMask (ตัวละครที่ปรับสีได้ เช่น office_male/office_female) โหลด
// มาสก์คู่กันไปเลย จะได้พร้อมใช้ recolor ทันทีที่ตัวสไปรท์หลักพร้อม ไม่ต้องรอ preload แยกรอบสอง
export function preloadSprite(id) {
  const def = getSpriteDef(id);
  if (!def) return Promise.resolve(null);
  let entry = _cache.get(id);
  if (entry) return entry.promise;
  entry = { img: null, ready: false, failed: false, promise: null, hairMaskImg: null, clothingMaskImg: null };
  const loads = [loadImage(def.image)];
  loads.push(def.hairMask ? loadImage(def.hairMask) : Promise.resolve(null));
  loads.push(def.clothingMask ? loadImage(def.clothingMask) : Promise.resolve(null));
  entry.promise = Promise.all(loads).then(([main, hair, clothing]) => {
    entry.img = main.img;
    if (main.ok) entry.ready = true;
    else {
      entry.failed = true;
      console.warn(`โหลดสไปรท์ตัวละคร "${id}" ไม่สำเร็จ (${def.image}) — ใช้ตัวละครเริ่มต้นแทน`);
    }
    if (hair && hair.ok) entry.hairMaskImg = hair.img;
    if (clothing && clothing.ok) entry.clothingMaskImg = clothing.img;
    return entry;
  });
  _cache.set(id, entry);
  return entry.promise;
}

// สร้าง (หรือคืนจาก cache) sheet ทั้งแผ่นที่ recolor ผม/เสื้อแล้ว — ใช้อัลกอริทึมเดียวกับ avatar.js
// เป๊ะ (คงความสว่างเดิมของแต่ละพิกเซล คูณด้วยสีเป้าหมาย) แค่ทำงานบน sheet เต็ม (grid 4x4) แทน
// แถบเดียว ต้อง sourceFrameWidth/Height ตรงกับที่ manifest ประกาศไว้เป๊ะ คืน null ถ้าไม่มีอะไรต้อง
// recolor (ไม่มี hair/shirt เลือกไว้ หรือตัวละครนี้ไม่รองรับมาสก์) ให้ผู้เรียก fallback ไปใช้ภาพดิบ
// cache ต่อ (id, hair, shirt) กันสร้าง canvas ใหม่ทุกเฟรม (ห้ามตาม requirement H)
export function getCustomHiresCanvas(spriteId, hair, shirt) {
  if (!hair && !shirt) return null;
  const entry = _cache.get(spriteId);
  if (!entry || !entry.ready) return null;
  if ((hair && !entry.hairMaskImg) && (shirt && !entry.clothingMaskImg)) return null;
  const key = `${spriteId}|${hair || ""}|${shirt || ""}`;
  let canvas = _customCache.get(key);
  if (canvas) return canvas;

  const def = getSpriteDef(spriteId);
  const w = def.sourceFrameWidth * def.columns, h = def.sourceFrameHeight * def.rows;
  canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(entry.img, 0, 0, w, h, 0, 0, w, h);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = w; maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext("2d");

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  if (hair && entry.hairMaskImg) {
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.drawImage(entry.hairMaskImg, 0, 0, w, h, 0, 0, w, h);
    applyMaskRecolor(d, maskCtx.getImageData(0, 0, w, h).data, hair);
  }
  if (shirt && entry.clothingMaskImg) {
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.drawImage(entry.clothingMaskImg, 0, 0, w, h, 0, 0, w, h);
    applyMaskRecolor(d, maskCtx.getImageData(0, 0, w, h).data, shirt);
  }
  ctx.putImageData(img, 0, 0);

  _customCache.set(key, canvas);
  return canvas;
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
  const vScale = def.visualScale || 1;
  return def.groundAnchorY * (def.displayHeight / def.sourceFrameHeight) * vScale + (def.tagOffsetY || 0);
}

// วาดตัวละครความละเอียดสูงแทนตัวละครเดิม — คืน true ถ้าวาดสำเร็จ (ให้ผู้เรียกข้ามการวาด
// avatar เดิม) false ถ้าไม่มี spriteId / ไม่รู้จัก id / รูปยังไม่พร้อม (ผู้เรียกต้อง fallback เอง)
// สูตรตำแหน่งอิงจุดกึ่งกลางเท้า ไม่ใช่มุมบนซ้าย — เปลี่ยนขนาดภาพ (displayWidth/Height) จะไม่ทำให้
// ตำแหน่ง logical x/y ขยับเลย เพราะคำนวณ offset จาก anchor เสมอ
export function drawHiresCharacter(ctx, ent, hop = 0) {
  if (!ent.spriteId) return false;
  const def = getSpriteDef(ent.spriteId);
  if (!def) return false; // id ไม่รู้จัก (เช่น client เก่ากว่า/manifest ไม่ตรงกัน) — fallback เงียบ ๆ
  const rawImg = getSpriteImage(ent.spriteId);
  if (!rawImg) return false; // ยังโหลดไม่เสร็จ หรือโหลดพัง — fallback ไปวาด avatar เดิมแทน
  // ตัวละครที่ปรับสีผม/เสื้อได้ (มี hairMask/clothingMask ใน manifest เช่น office_male/female) —
  // ใช้ sheet ที่ recolor แล้วแทนถ้ามีการเลือกสี ไม่งั้นใช้ภาพดิบตามปกติ
  const img = (ent.hair || ent.shirt) ? (getCustomHiresCanvas(ent.spriteId, ent.hair, ent.shirt) || rawImg) : rawImg;

  const dirIdx = directionIndex(ent);
  const frameIdx = frameIndexFor(ent, def);
  const sx = frameIdx * def.sourceFrameWidth;
  const sy = dirIdx * def.sourceFrameHeight;

  // visualScale ปรับเฉพาะขนาด/ตำแหน่งที่ "วาด" เท่านั้น (สเกลรอบจุดยึดเท้า ไม่ขยับ entity.x/y
  // จริง ไม่แตะ collisionWidth/Height) — ใช้ปรับความสูงให้ใกล้เคียงกันระหว่างตัวละครที่มีชุด
  // เกราะ/ปีก/ผมยาวต่างกัน ส่วน visualOffsetX/Y ใช้ขยับภาพเป็นพิกเซลเพิ่มเติมกรณีจำเป็น
  const vScale = def.visualScale || 1;
  const scaleX = (def.displayWidth / def.sourceFrameWidth) * vScale;
  const scaleY = (def.displayHeight / def.sourceFrameHeight) * vScale;
  const anchorDisplayX = def.anchorX * scaleX;
  const anchorDisplayY = def.groundAnchorY * scaleY;

  const dx = Math.round(ent.x - anchorDisplayX + (def.visualOffsetX || 0));
  const dy = Math.round(ent.y - anchorDisplayY - hop + (def.visualOffsetY || 0));

  ctx.drawImage(
    img,
    sx, sy, def.sourceFrameWidth, def.sourceFrameHeight,
    dx, dy, def.sourceFrameWidth * scaleX, def.sourceFrameHeight * scaleY,
  );
  return true;
}

// ---------- พรีวิวหน้าสร้างตัวละคร (section E) ----------
// contain-fit ลง canvas ขนาด boxW x boxH โดยรักษาสัดส่วนเสมอ (ห้าม stretch/บีบ) ยึดตำแหน่งจาก
// ground anchor เหมือนกันกับตอนวาดในเกมจริง (ไม่ใช่แค่กึ่งกลางกล่องเฉย ๆ)
export function drawSpritePreview(ctx, canvas, spriteId, dir = "down", hair = null, shirt = null) {
  const def = getSpriteDef(spriteId);
  const rawImg = getSpriteImage(spriteId);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!def || !rawImg) return false;
  const img = (hair || shirt) ? (getCustomHiresCanvas(spriteId, hair, shirt) || rawImg) : rawImg;
  const boxW = canvas.width, boxH = canvas.height;
  const MARGIN = 0.92; // เผื่อขอบเล็กน้อยกันชนขอบกล่องพอดีเป๊ะ
  // คูณ visualScale ด้วยเพื่อให้พรีวิวตรงกับขนาดจริงตอนเดินในเกม (WYSIWYG กับ Phase H ที่ normalize
  // ความสูงตัวละครแต่ละตัว) — ตัวไหนถูกย่อ/ขยายในเกม พรีวิวก็ย่อ/ขยายตามสัดส่วนเดียวกัน
  const scale = Math.min(boxW / def.sourceFrameWidth, boxH / def.sourceFrameHeight) * MARGIN * (def.visualScale || 1);
  const dirIdx = Math.max(0, def.directions.indexOf(dir));
  const sx = 0, sy = dirIdx * def.sourceFrameHeight; // เฟรมนิ่ง (frame 0) พอสำหรับพรีวิว
  const drawW = def.sourceFrameWidth * scale, drawH = def.sourceFrameHeight * scale;
  const dx = boxW / 2 - def.anchorX * scale;
  const dy = boxH * 0.9 - def.groundAnchorY * scale;
  ctx.drawImage(img, sx, sy, def.sourceFrameWidth, def.sourceFrameHeight, dx, dy, drawW, drawH);
  return true;
}
