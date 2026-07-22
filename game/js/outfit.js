// ชุดคอสตูมเต็มตัว — โหลดชีต + วาดแทนที่ตัวละครทั้งตัว (ไม่ใช่วาดทับเป็นชิ้น ๆ) เข้ากับ
// drawChar ใน render.js ต้นฉบับมี walk-cycle 4 ทิศจริงเหมือนตัวละครปกติ เลยใช้ spriteFrame()
// เดียวกับตัวละครเพื่อเลือกเฟรม/ทิศได้ตรง ๆ ไม่ต้องคำนวณเพิ่ม
//
// Recolor ทั้งชุดเป็นสีเดียว (ต่างจาก avatar.js ที่แยก mask ผม/เสื้อ) — ใช้ alpha ของสไปรท์เอง
// เป็น mask ตรง ๆ (ทุกพิกเซลทึบ = จุดที่ recolor) อัลกอริทึมเดียวกับ avatar.js: คงความสว่างเดิม
// ของแต่ละพิกเซลไว้ แล้วคูณด้วยสีเป้าหมาย

import { spriteFrame } from "./entities.js";
import { hexToRgb } from "./avatar.js";
import { OUTFITS, OUTFIT_FRAME_W, OUTFIT_FRAME_H, OUTFIT_DIRS, OUTFIT_FRAMES, outfitRow } from "./outfit_data.js";

let outfitImg = null;
export function loadOutfitsImage() {
  if (!outfitImg) {
    outfitImg = new Image();
    outfitImg.src = "assets/outfits.png";
  }
  return outfitImg;
}
export function outfitImageEl() { return outfitImg; }

const ROW_W = OUTFIT_FRAME_W * OUTFIT_DIRS.length * OUTFIT_FRAMES;
const recolorCache = new Map();

function applyWholeRecolor(d, targetHex) {
  const [tr, tg, tb] = hexToRgb(targetHex);
  let lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    const k = 0.55 + 0.45 * ((v - lo) / span);
    d[i] = Math.round(tr * k); d[i + 1] = Math.round(tg * k); d[i + 2] = Math.round(tb * k);
  }
}

function getRecoloredRow(row, colorHex) {
  const key = row + "|" + colorHex;
  let canvas = recolorCache.get(key);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = ROW_W; canvas.height = OUTFIT_FRAME_H;
  const cx = canvas.getContext("2d");
  cx.imageSmoothingEnabled = false;
  cx.drawImage(outfitImg, 0, row * OUTFIT_FRAME_H, ROW_W, OUTFIT_FRAME_H, 0, 0, ROW_W, OUTFIT_FRAME_H);
  const imgData = cx.getImageData(0, 0, ROW_W, OUTFIT_FRAME_H);
  applyWholeRecolor(imgData.data, colorHex);
  cx.putImageData(imgData, 0, 0);
  recolorCache.set(key, canvas);
  return canvas;
}

// ent.outfit = id ใน OUTFITS หรือ null, ent.outfitColor = "#rrggbb" หรือ null (สีเดิม)
// คืน true ถ้าวาดชุดแทนตัวละครไปแล้ว (ให้ drawChar ข้ามการวาดสไปรท์ตัวละครเดิม)
export function drawOutfitFrame(ctx, world, ent, dx, dy) {
  if (!ent.outfit || !outfitImg || !outfitImg.complete) return false;
  const row = outfitRow(ent.outfit);
  if (row < 0) return false;
  const { frameW, frameH } = world.config;
  const col = spriteFrame(ent);
  const source = ent.outfitColor ? getRecoloredRow(row, ent.outfitColor) : outfitImg;
  const sy = ent.outfitColor ? 0 : row * OUTFIT_FRAME_H;
  ctx.drawImage(source, col * OUTFIT_FRAME_W, sy, OUTFIT_FRAME_W, OUTFIT_FRAME_H, dx, dy, frameW, frameH);
  return true;
}
