// เมนู 👕 ในเกม — ใส่/ถอดชุดคอสตูมเต็มตัวทันที ไม่มีค่าใช้จ่าย ปรับสีทั้งชุดได้อิสระ
// เปลี่ยนแล้ว sync ไปให้คนอื่นเห็นทันทีผ่าน world.net (เหมือน setPet) และจำไว้ใน homes/<uid>
// ใช้ DOM id เดิมจากระบบเครื่องแต่งกายแบบชิ้น ๆ รุ่นก่อน (#cosmetics-btn/#cosmetics-overlay ฯลฯ)
// เพราะ CSS ตำแหน่ง/ขนาดปุ่มถูกต้องอยู่แล้ว เปลี่ยนแค่เนื้อหาเมนูข้างใน

import { OUTFITS, OUTFIT_FRAME_W, OUTFIT_FRAME_H } from "./outfit_data.js";
import { outfitImageEl } from "./outfit.js";
import { SHIRT_COLORS } from "./data.js";
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

function equip(world, outfitId, color) {
  world.player.outfit = outfitId;
  world.player.outfitColor = color;
  const dec = world.decor;
  if (dec) {
    dec.myHome.outfit = outfitId;
    dec.myHome.outfitColor = color;
    saveHome(world);
  }
  if (world.net && world.net.updateOutfit) world.net.updateOutfit(outfitId, color);
  render(world);
}

function outfitThumb(id) {
  const c = document.createElement("canvas");
  c.width = OUTFIT_FRAME_W; c.height = OUTFIT_FRAME_H;
  const cx = c.getContext("2d");
  cx.imageSmoothingEnabled = false;
  const img = outfitImageEl();
  const row = OUTFITS.findIndex(o => o.id === id);
  const draw = () => cx.drawImage(img, 0, row * OUTFIT_FRAME_H, OUTFIT_FRAME_W, OUTFIT_FRAME_H, 0, 0, OUTFIT_FRAME_W, OUTFIT_FRAME_H);
  if (img && img.complete) draw(); else if (img) img.addEventListener("load", draw, { once: true });
  return c;
}

function render(world) {
  const root = document.getElementById("cosmetics-sections");
  root.textContent = "";
  const current = { outfit: world.player.outfit || null, color: world.player.outfitColor || null };

  const outfitSection = document.createElement("div");
  outfitSection.className = "cosmetics-section";
  const outfitLabel = document.createElement("div");
  outfitLabel.className = "cosmetics-slot-label";
  outfitLabel.textContent = "ชุด";
  outfitSection.appendChild(outfitLabel);

  const outfitGrid = document.createElement("div");
  outfitGrid.className = "cosmetics-grid";
  const none = document.createElement("div");
  none.className = "cosmetics-opt" + (!current.outfit ? " selected" : "");
  none.innerHTML = '<span class="cosmetics-emoji">🚫</span><span>ไม่ใส่ (ชุดเดิม)</span>';
  none.addEventListener("click", () => equip(world, null, null));
  outfitGrid.appendChild(none);

  for (const o of OUTFITS) {
    const opt = document.createElement("div");
    opt.className = "cosmetics-opt" + (current.outfit === o.id ? " selected" : "");
    opt.appendChild(outfitThumb(o.id));
    const name = document.createElement("span");
    name.textContent = o.name;
    opt.appendChild(name);
    opt.addEventListener("click", () => equip(world, o.id, current.color));
    outfitGrid.appendChild(opt);
  }
  outfitSection.appendChild(outfitGrid);
  root.appendChild(outfitSection);

  if (current.outfit) {
    const colorSection = document.createElement("div");
    colorSection.className = "cosmetics-section";
    const colorLabel = document.createElement("div");
    colorLabel.className = "cosmetics-slot-label";
    colorLabel.textContent = "สีชุด";
    colorSection.appendChild(colorLabel);

    const colorRow = document.createElement("div");
    colorRow.className = "swatches";
    const auto = document.createElement("div");
    auto.className = "sw auto" + (!current.color ? " selected" : "");
    auto.title = "สีเดิม";
    auto.addEventListener("click", () => equip(world, current.outfit, null));
    colorRow.appendChild(auto);
    for (const hex of SHIRT_COLORS) {
      const sw = document.createElement("div");
      sw.className = "sw" + (current.color === hex ? " selected" : "");
      sw.style.background = hex;
      sw.addEventListener("click", () => equip(world, current.outfit, hex));
      colorRow.appendChild(sw);
    }
    colorSection.appendChild(colorRow);
    root.appendChild(colorSection);
  }
}
