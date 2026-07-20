// Daily Login Rewards — รับไอเทม exclusive วันละ 1 ชิ้น รวม 30 วัน
// วันใหม่เริ่มที่เที่ยงคืนตามเวลาจริงของเครื่องผู้เล่น; ขาดวันไม่รีเซ็ต (มารับวันถัดไปต่อได้)
// สถานะเก็บใน homes/<uid>.login = { days: จำนวนวันที่รับแล้ว, lastClaim: "YYYY-MM-DD" }

import { LOGIN_ITEMS } from "./login_data.js";
import { addSystemLine } from "./ui.js";
import { saveHome, iconFor } from "./decor.js";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function initLoginRewards(world, ui) {
  const dec = world.decor;
  document.getElementById("gift-btn").addEventListener("click", () => toggleLogin(world, true));
  document.getElementById("login-close").addEventListener("click", () => toggleLogin(world, false));
  const overlay = document.getElementById("login-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleLogin(world, false); });
  document.getElementById("login-claim").addEventListener("click", () => claim(world, ui));

  // popup อัตโนมัติตอนเข้าเกม ถ้ายังมีของให้รับวันนี้ (รอข้อมูลห้องโหลดจาก Firebase ก่อน)
  (dec.ready || Promise.resolve()).then(() => {
    ensureLogin(dec);
    setTimeout(() => { if (canClaim(world)) toggleLogin(world, true); }, 1200);
  });
}

function ensureLogin(dec) {
  if (!dec.myHome.login) dec.myHome.login = { days: 0, lastClaim: "" };
}

export function canClaim(world) {
  const l = world.decor.myHome.login;
  return l && l.days < LOGIN_ITEMS.length && l.lastClaim !== todayStr();
}

export function toggleLogin(world, open) {
  document.getElementById("login-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

function render(world) {
  const dec = world.decor;
  ensureLogin(dec);
  const l = dec.myHome.login;
  const grid = document.getElementById("login-grid");
  grid.textContent = "";
  LOGIN_ITEMS.forEach((it, i) => {
    const day = i + 1;
    const cell = document.createElement("div");
    cell.className = "login-cell";
    if (day <= l.days) cell.classList.add("claimed");
    else if (day === l.days + 1 && canClaim(world)) cell.classList.add("today");
    else cell.classList.add("locked");
    cell.appendChild(iconFor(dec, it.id, 1.5));
    const label = document.createElement("span");
    label.textContent = `วัน ${day}`;
    cell.appendChild(label);
    if (day <= l.days) {
      const check = document.createElement("span");
      check.className = "login-check";
      check.textContent = "✓";
      cell.appendChild(check);
    }
    cell.title = it.name;
    grid.appendChild(cell);
  });

  const btn = document.getElementById("login-claim");
  const status = document.getElementById("login-status");
  if (l.days >= LOGIN_ITEMS.length) {
    btn.classList.add("hidden");
    status.textContent = "🎉 รับครบทั้ง 30 วันแล้ว! ขอบคุณที่แวะมาทุกวัน";
  } else if (canClaim(world)) {
    btn.classList.remove("hidden");
    btn.textContent = `🎁 รับ "${LOGIN_ITEMS[l.days].name}" (วัน ${l.days + 1})`;
    status.textContent = "";
  } else {
    btn.classList.add("hidden");
    status.textContent = "รับของวันนี้แล้ว ✓ กลับมาใหม่หลังเที่ยงคืนนะ";
  }
}

function claim(world, ui) {
  const dec = world.decor;
  ensureLogin(dec);
  const l = dec.myHome.login;
  if (!canClaim(world)) return;
  const item = LOGIN_ITEMS[l.days];
  l.days += 1;
  l.lastClaim = todayStr();
  dec.myHome.items.push({ id: item.id, x: null, y: null });
  saveHome(world);
  addSystemLine(ui, `🎁 รับ "${item.name}" (login วัน ${l.days}/30) — ไปจัดวางในห้อง 🏠 ได้เลย!`);
  render(world);
}
