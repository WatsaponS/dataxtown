// เมนู 👕 ในเกม — ใส่/ถอดชุดคอสตูมเต็มตัวทันที ไม่มีค่าใช้จ่าย
// เปลี่ยนแล้ว sync ไปให้คนอื่นเห็นทันทีผ่าน world.net (เหมือน setPet) และจำไว้ใน homes/<uid>
// ใช้ DOM id เดิมจากระบบเครื่องแต่งกายแบบชิ้น ๆ รุ่นก่อน (#cosmetics-btn/#cosmetics-overlay ฯลฯ)
// เพราะ CSS ตำแหน่ง/ขนาดปุ่มถูกต้องอยู่แล้ว เปลี่ยนแค่เนื้อหาเมนูข้างใน
//
// ตัวเลือก "ตัวละครฐาน" (สไปรท์ความละเอียดสูง) ไม่ได้อยู่ในเมนูนี้ — เลือกได้แค่ตอนสร้างตัวละคร
// (หน้าแรก) เท่านั้น ตัวละครความละเอียดสูงตัวอื่นทั้งหมดเข้าถึงผ่าน "ชุด" ด้านล่างนี้เพียงทางเดียว

import { OUTFITS, OUTFIT_SRC_W, OUTFIT_SRC_H, OUTFIT_FRAME_W, OUTFIT_FRAME_H } from "./outfit_data.js";
import { outfitImageEl } from "./outfit.js";
import { saveHome } from "./decor.js";

export function initOutfitMenu(world, ui) {
  document.getElementById("cosmetics-btn").addEventListener("click", () => toggleOutfitMenu(world, true));
  document.getElementById("cosmetics-close").addEventListener("click", () => toggleOutfitMenu(world, false));
  const overlay = document.getElementById("cosmetics-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleOutfitMenu(world, false); });
}

export function toggleOutfitMenu(world, open) {
  document.getElementById("cosmetics-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

function equip(world, outfitId) {
  world.player.outfit = outfitId;
  const dec = world.decor;
  if (dec) {
    dec.myHome.outfit = outfitId;
    saveHome(world);
  }
  if (world.net && world.net.updateOutfit) world.net.updateOutfit(outfitId);
  render(world);
}

function outfitThumb(id) {
  const c = document.createElement("canvas");
  c.width = OUTFIT_FRAME_W; c.height = OUTFIT_FRAME_H;
  const cx = c.getContext("2d");
  cx.imageSmoothingEnabled = false;
  const img = outfitImageEl();
  const row = OUTFITS.findIndex(o => o.id === id);
  // ครอปจาก sheet ต้นฉบับความละเอียดสูง (SRC_W/H) ไม่ใช่ FRAME_W/H ที่วาดจริง — พรีวิวจะคมกว่า
  const draw = () => cx.drawImage(img, 0, row * OUTFIT_SRC_H, OUTFIT_SRC_W, OUTFIT_SRC_H, 0, 0, OUTFIT_FRAME_W, OUTFIT_FRAME_H);
  if (img && img.complete) draw(); else if (img) img.addEventListener("load", draw, { once: true });
  return c;
}

function render(world) {
  const root = document.getElementById("cosmetics-sections");
  root.textContent = "";
  const current = world.player.outfit || null;

  const outfitSection = document.createElement("div");
  outfitSection.className = "cosmetics-section";
  const outfitLabel = document.createElement("div");
  outfitLabel.className = "cosmetics-slot-label";
  outfitLabel.textContent = "ชุด";
  outfitSection.appendChild(outfitLabel);

  const outfitGrid = document.createElement("div");
  outfitGrid.className = "cosmetics-grid";
  const none = document.createElement("div");
  none.className = "cosmetics-opt" + (!current ? " selected" : "");
  none.innerHTML = '<span class="cosmetics-emoji">🚫</span><span>ไม่ใส่ (ชุดเดิม)</span>';
  none.addEventListener("click", () => equip(world, null));
  outfitGrid.appendChild(none);

  for (const o of OUTFITS) {
    const opt = document.createElement("div");
    opt.className = "cosmetics-opt" + (current === o.id ? " selected" : "");
    opt.appendChild(outfitThumb(o.id));
    const name = document.createElement("span");
    name.textContent = o.name;
    opt.appendChild(name);
    opt.addEventListener("click", () => equip(world, o.id));
    outfitGrid.appendChild(opt);
  }
  outfitSection.appendChild(outfitGrid);
  root.appendChild(outfitSection);
}
