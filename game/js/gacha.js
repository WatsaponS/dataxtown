// ตู้กาชาปอง — วางตำแหน่งคงที่ในออฟฟิศ (ปีกตะวันออก ข้าง phone booths)
// เดินเข้าใกล้ + กด G เพื่อสุ่ม 1 ครั้ง ราคา 100 แต้ม
// แต้มหักจาก "ยอดคงเหลือ" (spent) เหมือนร้านค้า — leaderboard ไม่ลด

import { GACHA_COST, GACHA_X, GACHA_Y, RARITY, rollGacha } from "./gacha_data.js";
import { balance, saveHome, iconFor } from "./decor.js";
import { addSystemLine } from "./ui.js";
import { spawnBurst } from "./fx.js";
import { bumpStat } from "./achievements.js";
import { bumpMission } from "./missions.js";

export { GACHA_X, GACHA_Y };
// ระยะจาก GACHA_Y (จุดอ้างอิงเข้าเล่น) ลงไปถึงขอบล่างของ sprite ที่แนบพื้น — export ให้ render.js
// ใช้ค่าเดียวกันตอน depth-sort กัน magic number สองจุดหลุดไม่ตรงกันแบบที่เคยเกิด (ตู้ไม่ขยับตาม GACHA_Y)
export const SPRITE_Y_OFFSET = 12;
const INTERACT_RADIUS = 46;

let pendingCelebration = false; // สุ่มได้ mythic/legendary รอบล่าสุด — ระเบิด confetti ตอนปิดโมดัล (ตอนเปิดอยู่บังฉากอยู่)
let machineImg = null;
export function loadGachaMachineImage() {
  if (!machineImg) { machineImg = new Image(); machineImg.src = "assets/gacha_machine.png"; }
  return machineImg;
}

let near = false; // ผู้เล่นยืนใกล้ตู้พอจะกด G ไหมตอนนี้ (คำนวณทุกเฟรม)
let pulling = false; // กันกดรัว/สุ่มซ้อน

export function initGacha(world, ui) {
  document.getElementById("gacha-pull-btn").addEventListener("click", () => pull(world, ui));
  document.getElementById("gacha-close-btn").addEventListener("click", () => toggleGacha(world, false));
  const overlay = document.getElementById("gacha-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleGacha(world, false); });
  document.getElementById("gacha-hint").addEventListener("click", () => toggleGacha(world, true));
}

// เรียกทุกเฟรมจาก game loop
export function updateGachaProximity(world) {
  if (!world.player) { near = false; return; }
  const d = Math.hypot(world.player.x - GACHA_X, world.player.y - GACHA_Y);
  near = d <= INTERACT_RADIUS;
  const hint = document.getElementById("gacha-hint");
  const gachaOpen = !document.getElementById("gacha-overlay").classList.contains("hidden");
  hint.classList.toggle("hidden", !near || gachaOpen);
}

export function isNearGacha() { return near; }

export function toggleGacha(world, open) {
  if (open && !near) return; // ต้องยืนใกล้ตู้ก่อน
  const overlay = document.getElementById("gacha-overlay");
  overlay.classList.toggle("hidden", !open);
  if (open) render(world);
  else {
    document.getElementById("gacha-hint").classList.toggle("hidden", !near);
    if (pendingCelebration) { // ปิดโมดัลพอดี ฉากโล่งแล้วค่อยระเบิด confetti ให้เห็น
      pendingCelebration = false;
      spawnBurst(GACHA_X, GACHA_Y - 20, { count: 30, life: 1, colors: ["#e14fd0", "#e7b94f", "#fff6dc"] });
    }
  }
}

// อัปเดตแค่ยอดคงเหลือ+ปุ่ม — เรียกได้บ่อย ๆ โดยไม่ไปยุ่งกับกล่องผลลัพธ์ที่อาจกำลังโชว์อยู่
function renderBalance(world) {
  document.getElementById("gacha-balance").textContent =
    `คงเหลือ ${balance(world)} แต้ม · สุ่ม 1 ครั้ง = ${GACHA_COST} แต้ม`;
  const btn = document.getElementById("gacha-pull-btn");
  btn.disabled = pulling || balance(world) < GACHA_COST;
  btn.textContent = pulling ? "กำลังสุ่ม..." : `🎰 สุ่มเลย! (${GACHA_COST} แต้ม)`;
}

// เรียกตอนเปิด modal ใหม่เท่านั้น — รีเซ็ตกล่องผลลัพธ์ของรอบก่อนหน้าทิ้ง
function render(world) {
  renderBalance(world);
  document.getElementById("gacha-result").classList.add("hidden");
  renderRateTable();
}

function renderRateTable() {
  const el = document.getElementById("gacha-rates");
  if (el.childElementCount) return; // ตารางอัตราคงที่ วาดครั้งเดียวพอ
  for (const key of ["mythic", "legendary", "epic", "rare", "common", "basic"]) {
    const r = RARITY[key];
    const row = document.createElement("div");
    row.className = "gacha-rate-row";
    row.style.color = r.color;
    row.textContent = `${r.emoji} ${r.label} — ${r.totalRate}%`;
    el.appendChild(row);
  }
}

function pull(world, ui) {
  if (pulling || balance(world) < GACHA_COST) return;
  pulling = true;
  document.getElementById("gacha-result").classList.add("hidden"); // เคลียร์ผลรอบก่อนหน้าทิ้ง
  renderBalance(world);

  const dec = world.decor;
  dec.myHome.spent = (dec.myHome.spent || 0) + GACHA_COST;
  const won = rollGacha();
  dec.myHome.items.push({ id: won.id, x: null, y: null });
  saveHome(world);
  if (world.onGachaPull) world.onGachaPull();
  bumpStat(world, ui, "gachaTotalPulls", 1);
  if (won.tier === "mythic") bumpStat(world, ui, "gachaMythicPulls", 1);
  else if (won.tier === "legendary") bumpStat(world, ui, "gachaLegendaryPulls", 1);
  bumpMission(world, ui, "gacha_pull", 1);

  setTimeout(() => {
    pulling = false;
    showResult(world, ui, won);
  }, 650); // หน่วงนิดให้รู้สึกเหมือนกำลังสุ่ม
}

function showResult(world, ui, won) {
  const r = RARITY[won.tier];
  const box = document.getElementById("gacha-result");
  box.classList.remove("hidden");
  box.style.borderColor = r.color;
  box.innerHTML = "";
  const dec = world.decor;
  box.appendChild(iconFor(dec, won.id, 3));
  const label = document.createElement("div");
  label.className = "gacha-result-tier";
  label.style.color = r.color;
  label.textContent = `${r.emoji} ${r.label}`;
  const name = document.createElement("div");
  name.className = "gacha-result-name";
  name.textContent = won.name;
  box.append(label, name);
  if (won.tier === "mythic" || won.tier === "legendary") { box.classList.add("gacha-glow"); pendingCelebration = true; }
  else box.classList.remove("gacha-glow");

  addSystemLine(ui, `🎰 สุ่มกาชาปองได้ "${won.name}" (${r.label} ${r.emoji}) — ไปจัดวางในห้อง 🏠 ได้เลย!`);
  renderBalance(world); // อัปเดตยอดคงเหลือ/ปุ่ม โดยไม่แตะกล่องผลลัพธ์ที่เพิ่งโชว์
}

// วาด sprite ตู้ลงบนแผนที่ (เรียกจาก render.js ในช่วง world-space ก่อน restore กล้อง)
export function drawGachaMachine(ctx) {
  const img = machineImg;
  if (!img || !img.complete) return;
  const spriteBottomY = GACHA_Y + SPRITE_Y_OFFSET;
  const dx = Math.round(GACHA_X - img.width / 2);
  const dy = Math.round(spriteBottomY - img.height);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(dx + 3, spriteBottomY - 2, img.width - 6, 3);
  ctx.drawImage(img, dx, dy);
}
