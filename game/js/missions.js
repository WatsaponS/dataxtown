// ภารกิจประจำวัน — สุ่ม 3 อันใหม่ทุกวัน (รีเซ็ตเที่ยงคืนตามเวลาเครื่อง) + streak วันติดต่อกัน
// สถานะเก็บใน homes/<uid>.daily = { date, missions:[{id,progress,done}], streak, allDoneAwarded }
// เหมือน .login ทุกประการ (ขาดวันไม่ล้าง progress เก่า แต่ streak รีเซ็ตถ้าขาดวัน — ตั้งใจให้ต่างจาก login)

import { MISSION_POOL, MISSIONS_PER_DAY, ALL_DONE_BONUS, STREAK_MILESTONE_EVERY, STREAK_MILESTONE_BONUS, missionById } from "./missions_data.js";
import { saveHome } from "./decor.js";
import { addSystemLine } from "./ui.js";
import { awardPoints } from "./quests.js";

const dateStr = offsetDays => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const todayStr = () => dateStr(0);
const yesterdayStr = () => dateStr(-1);

function pickDailyMissions() {
  const pool = [...MISSION_POOL];
  const picked = [];
  while (picked.length < MISSIONS_PER_DAY && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked.map(m => ({ id: m.id, progress: 0, done: false }));
}

// เรียกตอนเข้าเกม/ก่อน bump ใด ๆ — สร้างชุดภารกิจวันใหม่ถ้าข้ามวันแล้ว พร้อมคำนวณ streak
function ensureDaily(world, ui) {
  const dec = world.decor;
  if (!dec.myHome.daily) dec.myHome.daily = { date: "", missions: [], streak: 0, allDoneAwarded: false };
  const d = dec.myHome.daily;
  const today = todayStr();
  if (d.date !== today) {
    d.streak = !d.date ? 1 : (d.date === yesterdayStr() ? d.streak + 1 : 1); // ขาดวัน = เริ่มนับใหม่
    d.date = today;
    d.missions = pickDailyMissions();
    d.allDoneAwarded = false;
    if (d.streak % STREAK_MILESTONE_EVERY === 0) {
      awardPoints(world, STREAK_MILESTONE_BONUS);
      if (ui) addSystemLine(ui, `🔥 เข้าเล่นต่อเนื่องครบ ${d.streak} วัน! โบนัสพิเศษ +${STREAK_MILESTONE_BONUS} แต้ม`);
    }
    saveHome(world);
    if (ui) {
      const names = d.missions.map(m => missionById(m.id)?.title).filter(Boolean).join(", ");
      addSystemLine(ui, `📋 ภารกิจวันนี้: ${names} — เปิดดูรายละเอียดที่ปุ่ม 📋`);
    }
  }
  return d;
}

export function initMissions(world, ui) {
  const dec = world.decor;
  document.getElementById("missions-btn").addEventListener("click", () => toggleMissions(world, true));
  document.getElementById("missions-close").addEventListener("click", () => toggleMissions(world, false));
  const overlay = document.getElementById("missions-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleMissions(world, false); });

  // ต่อคิว hook ที่มีคนใช้อยู่แล้ว (tutorial.js ตั้งไว้ก่อน, achievements.js อาจต่อไปแล้ว) — ห้ามทับ
  const prevChat = world.onChat;
  world.onChat = (ent, text) => {
    if (prevChat) prevChat(ent, text);
    if (ent === world.player) bumpMission(world, ui, "chat", 1);
  };
  const prevQuizDone = world.onQuizDone;
  world.onQuizDone = correct => {
    if (prevQuizDone) prevQuizDone(correct);
    if (correct > 0) bumpMission(world, ui, "quiz", 1);
  };
  const prevBoardOpen = world.onBoardOpen;
  world.onBoardOpen = () => { if (prevBoardOpen) prevBoardOpen(); bumpMission(world, ui, "board_open", 1); };
  const prevShopBuy = world.onShopBuy;
  world.onShopBuy = () => { if (prevShopBuy) prevShopBuy(); bumpMission(world, ui, "shop_buy", 1); };
  const prevItemPlaced = world.onItemPlaced;
  world.onItemPlaced = () => { if (prevItemPlaced) prevItemPlaced(); bumpMission(world, ui, "item_placed", 1); };
  const prevRoomVisit = world.onRoomVisit;
  world.onRoomVisit = () => { if (prevRoomVisit) prevRoomVisit(); bumpMission(world, ui, "visit_room", 1); };

  (dec.ready || Promise.resolve()).then(() => ensureDaily(world, ui));
}

// เรียกจากระบบอื่น (duel win, gacha pull) ที่ไม่มี hook กลางให้ต่อคิวอยู่แล้ว
export function bumpMission(world, ui, type, amount = 1) {
  const dec = world.decor;
  if (!dec || !dec.myHome) return;
  const d = ensureDaily(world, ui);
  let changed = false;
  for (const m of d.missions) {
    if (m.id !== type || m.done) continue;
    m.progress = (m.progress || 0) + amount;
    if (m.progress >= 1) {
      m.done = true;
      changed = true;
      const def = missionById(m.id);
      awardPoints(world, def.reward);
      addSystemLine(ui, `📋 ภารกิจวันนี้ "${def.title}" สำเร็จ! +${def.reward} แต้ม`);
    }
  }
  if (!changed) return;
  const allDone = d.missions.every(m => m.done);
  if (allDone && !d.allDoneAwarded) {
    d.allDoneAwarded = true;
    awardPoints(world, ALL_DONE_BONUS);
    addSystemLine(ui, `🎉 ทำภารกิจวันนี้ครบหมดแล้ว! โบนัส +${ALL_DONE_BONUS} แต้ม — พรุ่งนี้มีภารกิจใหม่มารออีก!`);
  }
  saveHome(world);
  if (!document.getElementById("missions-overlay").classList.contains("hidden")) render(world);
}

export function toggleMissions(world, open) {
  document.getElementById("missions-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

function render(world) {
  const dec = world.decor;
  const d = dec.myHome.daily || { missions: [], streak: 0 };
  document.getElementById("missions-streak").textContent = `🔥 เข้าเล่นต่อเนื่อง ${d.streak || 0} วัน`;

  const list = document.getElementById("missions-list");
  list.textContent = "";
  for (const m of d.missions || []) {
    const def = missionById(m.id);
    if (!def) continue;
    const row = document.createElement("div");
    row.className = "mission-row" + (m.done ? " done" : "");
    const icon = document.createElement("span");
    icon.className = "mission-icon";
    icon.textContent = def.icon;
    const body = document.createElement("div");
    body.className = "mission-body";
    const title = document.createElement("div");
    title.className = "mission-title";
    title.textContent = def.title;
    const desc = document.createElement("div");
    desc.className = "mission-desc";
    desc.textContent = def.desc;
    body.append(title, desc);
    const reward = document.createElement("span");
    reward.className = "mission-reward";
    reward.textContent = m.done ? `✓ +${def.reward}` : `+${def.reward}`;
    row.append(icon, body, reward);
    list.appendChild(row);
  }

  const bonus = document.getElementById("missions-bonus");
  const allDone = (d.missions || []).length > 0 && d.missions.every(m => m.done);
  bonus.textContent = allDone ? `🎉 ทำครบวันนี้แล้ว! ได้โบนัส +${ALL_DONE_BONUS} แต้ม` : `ทำครบทั้ง ${MISSIONS_PER_DAY} อันรับโบนัสเพิ่ม +${ALL_DONE_BONUS} แต้ม`;
}
