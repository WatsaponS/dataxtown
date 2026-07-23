// เมนู 👕 ในเกม — ใส่/ถอดชุดคอสตูมเต็มตัวทันที ไม่มีค่าใช้จ่าย
// เปลี่ยนแล้ว sync ไปให้คนอื่นเห็นทันทีผ่าน world.net (เหมือน setPet) และจำไว้ใน homes/<uid>
// ใช้ DOM id เดิมจากระบบเครื่องแต่งกายแบบชิ้น ๆ รุ่นก่อน (#cosmetics-btn/#cosmetics-overlay ฯลฯ)
// เพราะ CSS ตำแหน่ง/ขนาดปุ่มถูกต้องอยู่แล้ว เปลี่ยนแค่เนื้อหาเมนูข้างใน

import { OUTFITS, OUTFIT_FRAME_W, OUTFIT_FRAME_H } from "./outfit_data.js";
import { outfitImageEl } from "./outfit.js";
import { saveHome } from "./decor.js";
import { SPRITE_MANIFEST, getSpriteDef } from "./sprites_manifest.js";
import { preloadSprite, drawSpritePreview } from "./sprites.js";

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

// เปลี่ยน "ตัวละครฐาน" (สไปรท์ความละเอียดสูง) กลางเซสชัน — คนละระบบกับ outfit (outfit ใส่ทับ
// avatar ทีหลังได้เสมอ ส่วนอันนี้คือ avatar/สไปรท์ตัวเองเลย) แต่ใช้เมนูเดียวกันเพื่อไม่ต้องเพิ่ม
// ปุ่ม/overlay ใหม่ — sync ออกไปให้ remote client อื่นเห็นทันทีผ่าน net.updateSpriteId (เหมือน
// updateOutfit/updatePet) ตั้ง/ล้าง collisionW/H จาก manifest เสมอ ไม่งั้น hitbox จะค้างค่าตัวเก่า
function equipSprite(world, spriteId) {
  world.player.spriteId = spriteId;
  if (spriteId) {
    preloadSprite(spriteId);
    const def = getSpriteDef(spriteId);
    if (def) { world.player.collisionW = def.collisionWidth; world.player.collisionH = def.collisionHeight; }
  } else {
    delete world.player.collisionW;
    delete world.player.collisionH;
  }
  const saved = JSON.parse(localStorage.getItem("dataxtown.avatar") || "null") || {};
  saved.spriteId = spriteId;
  localStorage.setItem("dataxtown.avatar", JSON.stringify(saved));
  if (world.net && world.net.updateSpriteId) world.net.updateSpriteId(spriteId);
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

  // ---------- ตัวละครฐาน (สไปรท์ความละเอียดสูง) ----------
  const spriteSection = document.createElement("div");
  spriteSection.className = "cosmetics-section";
  const spriteLabel = document.createElement("div");
  spriteLabel.className = "cosmetics-slot-label";
  spriteLabel.textContent = "ตัวละคร";
  spriteSection.appendChild(spriteLabel);

  const spriteGrid = document.createElement("div");
  spriteGrid.className = "cosmetics-grid";
  const currentSprite = world.player.spriteId || null;
  const noneSprite = document.createElement("div");
  noneSprite.className = "cosmetics-opt" + (!currentSprite ? " selected" : "");
  noneSprite.innerHTML = '<span class="cosmetics-emoji">🙂</span><span>ตัวละครพื้นฐาน</span>';
  noneSprite.addEventListener("click", () => equipSprite(world, null));
  spriteGrid.appendChild(noneSprite);

  for (const def of SPRITE_MANIFEST) {
    const opt = document.createElement("div");
    opt.className = "cosmetics-opt" + (currentSprite === def.id ? " selected" : "");
    opt.dataset.sprite = def.id;
    const c = document.createElement("canvas");
    c.className = "hires-thumb";
    c.width = 48; c.height = 48;
    opt.appendChild(c);
    const name = document.createElement("span");
    name.textContent = def.name;
    opt.appendChild(name);
    opt.addEventListener("click", () => {
      loadSpriteThumb(c, def.id); // เผื่อคลิกก่อน observer ทันเวลา
      equipSprite(world, def.id);
    });
    spriteGrid.appendChild(opt);
  }
  spriteSection.appendChild(spriteGrid);
  root.appendChild(spriteSection);

  // lazy-load พรีวิวเฉพาะการ์ดที่เลื่อนมาใกล้จะเห็น — ไม่โหลดสไปรท์ทั้ง 38+ ตัวพร้อมกันทุกครั้งที่
  // เปิดเมนู (preloadSprite เองก็ cache ต่อ id อยู่แล้ว แต่รอบแรกที่เปิดเมนูไม่ควรยิง fetch รวดเดียว)
  const card = document.getElementById("cosmetics-card");
  const observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const canvas = e.target.querySelector("canvas.hires-thumb");
      if (canvas) loadSpriteThumb(canvas, e.target.dataset.sprite);
      observer.unobserve(e.target);
    }
  }, { root: card, rootMargin: "150px 0px" });
  spriteGrid.querySelectorAll(".cosmetics-opt[data-sprite]").forEach(opt => observer.observe(opt));
  if (currentSprite) {
    const sel = spriteGrid.querySelector(`.cosmetics-opt[data-sprite="${currentSprite}"] canvas.hires-thumb`);
    if (sel) loadSpriteThumb(sel, currentSprite);
  }
}

function loadSpriteThumb(canvas, id) {
  if (canvas.dataset.loaded) return;
  canvas.dataset.loaded = "1";
  preloadSprite(id).then(() => drawSpritePreview(canvas.getContext("2d"), canvas, id, "down"));
}
