// เครื่องแต่งกาย — โหลดชีต + วาดทับตัวละคร (หัว/ลำตัว/ขา/ปีก) เข้ากับ drawChar ใน render.js
// ต้นฉบับมีท่าเดียว (หน้าตรง) ไม่มี walk-cycle 4 ทิศแบบ avatar — เกมเลยวาดภาพเดียวกันซ้ำทุกทิศ
// (ดูเหตุผลเต็มใน build_cosmetics.py) ตำแหน่ง/สเกลถูก bake ไว้ในเฟรม 32x50 แล้ว วาดทับ (dx,dy)
// เดียวกับตัวละครได้ตรง ๆ ไม่ต้องคำนวณตำแหน่งเพิ่ม

import { COSMETIC_FRAME_W, COSMETIC_FRAME_H, cosmeticRow } from "./cosmetics_data.js";

let cosImg = null;
export function loadCosmeticsImage() {
  if (!cosImg) {
    cosImg = new Image();
    cosImg.src = "assets/cosmetics.png";
  }
  return cosImg;
}
export function cosmeticImageEl() { return cosImg; }

// ent.cosmetics = { hat, shirt, bottom, wings } — ค่าเป็น id ไอเทมหรือ null (ไม่ใส่)
export function setCosmetic(ent, category, id) {
  if (!ent.cosmetics) ent.cosmetics = { hat: null, shirt: null, bottom: null, wings: null };
  ent.cosmetics[category] = id || null;
}

// วาด 1 ชิ้นที่ใส่อยู่ในช่อง category ทับตำแหน่ง (dx,dy) เดียวกับตัวละคร — เรียกจาก drawChar
// (ปีกเรียกก่อนวาดตัวละคร ให้อยู่หลังลำตัว, หมวก/เสื้อ/กางเกงเรียกหลังวาดตัวละคร ให้อยู่หน้า)
export function drawCosmeticLayer(ctx, ent, category, dx, dy) {
  const img = cosImg;
  if (!img || !img.complete || !ent.cosmetics || !ent.cosmetics[category]) return;
  const row = cosmeticRow(ent.cosmetics[category]);
  if (row < 0) return;
  ctx.drawImage(img, 0, row * COSMETIC_FRAME_H, COSMETIC_FRAME_W, COSMETIC_FRAME_H,
    dx, dy, COSMETIC_FRAME_W, COSMETIC_FRAME_H);
}
