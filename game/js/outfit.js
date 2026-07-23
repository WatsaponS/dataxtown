// ชุดคอสตูมเต็มตัว — โหลดชีต + วาดแทนที่ตัวละครทั้งตัว (ไม่ใช่วาดทับเป็นชิ้น ๆ) เข้ากับ
// drawChar ใน render.js ต้นฉบับมี walk-cycle 4 ทิศจริงเหมือนตัวละครปกติ เลยใช้ spriteFrame()
// เดียวกับตัวละครเพื่อเลือกเฟรม/ทิศได้ตรง ๆ ไม่ต้องคำนวณเพิ่ม
//
// เฟรมชุดใหญ่กว่าตัวละครฐาน (ดู OUTFIT_FRAME_W/H ใน outfit_data.js) — วาดด้วยขนาดตัวเองเสมอ
// (ไม่ยืด/หดให้พอดี config.frameW/frameH ของตัวละครฐาน) เพราะต้นฉบับสไปรท์ละเอียดกว่าตัวละคร
// ฐานมาก ถ้าบีบลงมาขนาดเดียวกันจะเสียรายละเอียดไปมาก — สมอที่จุดเท้าเดียวกับตัวละครฐานเสมอ
// (ดูจุดยึด dx/dy ด้านล่าง) กัน "ลอย" ผิดตำแหน่งเวลาชุดสูง/กว้างกว่า

import { spriteFrame } from "./entities.js";
import { OUTFIT_SRC_W, OUTFIT_SRC_H, OUTFIT_FRAME_W, OUTFIT_FRAME_H, outfitRow } from "./outfit_data.js";

let outfitImg = null;
export function loadOutfitsImage() {
  if (!outfitImg) {
    outfitImg = new Image();
    outfitImg.src = "assets/outfits.png";
  }
  return outfitImg;
}
export function outfitImageEl() { return outfitImg; }

// ent.outfit = id ใน OUTFITS หรือ null — คืน true ถ้าวาดชุดแทนตัวละครไปแล้ว (ให้ drawChar
// ข้ามการวาดสไปรท์ตัวละครเดิม) hop = ระยะเด้งขึ้นตอน emote กระโดด (px, บวก = ลอยขึ้น)
export function drawOutfitFrame(ctx, ent, hop = 0) {
  if (!ent.outfit || !outfitImg || !outfitImg.complete) return false;
  const row = outfitRow(ent.outfit);
  if (row < 0) return false;
  const col = spriteFrame(ent);
  const dx = Math.round(ent.x - OUTFIT_FRAME_W / 2);
  const dy = Math.round(ent.y - OUTFIT_FRAME_H + 1 - hop);
  // ครอปจาก sheet ต้นฉบับความละเอียดสูง (SRC_W/H) แต่วาดลงขนาดจอเดิม (FRAME_W/H) — ให้ canvas
  // ย่อตอน draw แทนการใช้ภาพที่ถูก downscale ไว้ล่วงหน้าแล้วในไฟล์ ภาพจะคมกว่าเดิมทั้งที่ขนาด/
  // ตำแหน่งในเกมเหมือนเดิมทุกประการ
  ctx.drawImage(outfitImg, col * OUTFIT_SRC_W, row * OUTFIT_SRC_H, OUTFIT_SRC_W, OUTFIT_SRC_H,
    dx, dy, OUTFIT_FRAME_W, OUTFIT_FRAME_H);
  return true;
}
