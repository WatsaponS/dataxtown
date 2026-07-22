// เมนู 🎭 ในเกม — ใส่/ถอดเครื่องแต่งกายทันที ไม่มีค่าใช้จ่าย (ต่างจากร้านค้าไอเทมห้อง)
// เปลี่ยนแล้ว sync ไปให้คนอื่นเห็นทันทีผ่าน world.net (เหมือน setPet) และจำไว้ใน homes/<uid>

import { SLOTS, SLOT_LABEL, cosmeticsByCategory, COSMETIC_FRAME_W, COSMETIC_FRAME_H, cosmeticRow } from "./cosmetics_data.js";
import { setCosmetic, cosmeticImageEl } from "./cosmetics.js";
import { saveHome } from "./decor.js";

export function initCosmeticsMenu(world, ui) {
  document.getElementById("cosmetics-btn").addEventListener("click", () => toggleCosmeticsMenu(world, true));
  document.getElementById("cosmetics-close").addEventListener("click", () => toggleCosmeticsMenu(world, false));
  const overlay = document.getElementById("cosmetics-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleCosmeticsMenu(world, false); });
}

export function toggleCosmeticsMenu(world, open) {
  document.getElementById("cosmetics-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

function equip(world, category, id) {
  setCosmetic(world.player, category, id);
  const dec = world.decor;
  if (dec) {
    dec.myHome.cosmetics = { ...(world.player.cosmetics) };
    saveHome(world);
  }
  if (world.net && world.net.updateCosmetics) world.net.updateCosmetics(world.player.cosmetics);
  render(world);
}

function render(world) {
  const root = document.getElementById("cosmetics-sections");
  root.textContent = "";
  const equipped = world.player.cosmetics || {};
  const img = cosmeticImageEl();

  for (const slot of SLOTS) {
    const section = document.createElement("div");
    section.className = "cosmetics-section";
    const label = document.createElement("div");
    label.className = "cosmetics-slot-label";
    label.textContent = SLOT_LABEL[slot];
    section.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "cosmetics-grid";

    const none = document.createElement("div");
    none.className = "cosmetics-opt" + (!equipped[slot] ? " selected" : "");
    none.innerHTML = '<span class="cosmetics-emoji">🚫</span><span>ไม่ใส่</span>';
    none.addEventListener("click", () => equip(world, slot, null));
    grid.appendChild(none);

    for (const item of cosmeticsByCategory(slot)) {
      const opt = document.createElement("div");
      opt.className = "cosmetics-opt" + (equipped[slot] === item.id ? " selected" : "");
      const c = document.createElement("canvas");
      c.width = COSMETIC_FRAME_W; c.height = COSMETIC_FRAME_H;
      const cc = c.getContext("2d");
      cc.imageSmoothingEnabled = false;
      const row = cosmeticRow(item.id);
      const draw = () => cc.drawImage(img, 0, row * COSMETIC_FRAME_H, COSMETIC_FRAME_W, COSMETIC_FRAME_H, 0, 0, COSMETIC_FRAME_W, COSMETIC_FRAME_H);
      if (img && img.complete) draw(); else if (img) img.addEventListener("load", draw, { once: true });
      const name = document.createElement("span");
      name.textContent = item.name;
      opt.append(c, name);
      opt.addEventListener("click", () => equip(world, slot, item.id));
      grid.appendChild(opt);
    }
    section.appendChild(grid);
    root.appendChild(section);
  }
}
