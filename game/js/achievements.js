// ความสำเร็จ + ตำแหน่งแสดง (title) — สะสมสถิติจากระบบอื่น (ดวล/กาชา/ควิซ/ตกแต่งห้อง)
// เก็บใน homes/<uid>.achievements = { stats:{...}, unlocked:[id...], selected: id|null } เหมือน .login
// ตำแหน่งที่เลือกจะ mirror ขึ้น leaderboard/<uid>.title ด้วย ให้คนอื่นเห็นบนป้ายชื่อแบบเรียลไทม์
// (ต้องใช้ fb.update ไม่ใช่ fb.set ตอนบันทึกแต้ม — ดู savePoints() ใน quests.js กันฟิลด์นี้โดนเขียนทับ)

import { ACHIEVEMENTS, achievementById } from "./achievements_data.js";
import { saveHome } from "./decor.js";
import { addSystemLine } from "./ui.js";

function ensureAchievements(dec) {
  if (!dec.myHome.achievements) dec.myHome.achievements = { stats: {}, unlocked: [], selected: null };
  const a = dec.myHome.achievements;
  if (!a.stats) a.stats = {};
  if (!a.unlocked) a.unlocked = [];
}

export function initAchievements(world, ui) {
  const dec = world.decor;
  document.getElementById("achv-btn").addEventListener("click", () => toggleAchievements(world, true));
  document.getElementById("achv-close").addEventListener("click", () => toggleAchievements(world, false));
  const overlay = document.getElementById("achv-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleAchievements(world, false); });

  // world.onItemPlaced มีคนใช้อยู่แล้ว (tutorial.js) —ต้องต่อคิว ไม่ใช่ทับ
  const prevItemPlaced = world.onItemPlaced;
  world.onItemPlaced = () => {
    if (prevItemPlaced) prevItemPlaced();
    bumpStat(world, ui, "itemsPlaced", 1);
  };

  (dec.ready || Promise.resolve()).then(() => {
    ensureAchievements(dec);
    // sync ใหม่เฉพาะตอนมี title อยู่แล้ว (เช่นเข้าเกมรอบใหม่) — กันสร้าง entry leaderboard เปล่า ๆ
    // ให้ผู้เล่นที่ไม่เคยได้แต้ม/ยังไม่เคยตั้ง title เลย
    if (dec.myHome.achievements.selected) syncTitleToLeaderboard(world, dec.myHome.achievements.selected);
  });
}

export function toggleAchievements(world, open) {
  document.getElementById("achv-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

// เรียกจากระบบอื่น (duel win, gacha pull, quiz จบ, วางไอเทม) เมื่อสถิติควรขยับ
export function bumpStat(world, ui, key, amount = 1) {
  const dec = world.decor;
  if (!dec || !dec.myHome) return;
  ensureAchievements(dec);
  const a = dec.myHome.achievements;
  a.stats[key] = (a.stats[key] || 0) + amount;
  const newly = ACHIEVEMENTS.filter(ac => ac.stat === key && a.stats[key] >= ac.target && !a.unlocked.includes(ac.id));
  if (newly.length) a.unlocked.push(...newly.map(ac => ac.id));
  saveHome(world);
  for (const ac of newly) {
    addSystemLine(ui, `🏅 ปลดล็อกความสำเร็จ: ${ac.icon} ${ac.name}! ไปตั้งเป็นตำแหน่งแสดงได้ที่เมนู 🏅`);
  }
}

function selectTitle(world, id) {
  const dec = world.decor;
  ensureAchievements(dec);
  dec.myHome.achievements.selected = id;
  saveHome(world);
  syncTitleToLeaderboard(world, id);
  render(world);
}

function syncTitleToLeaderboard(world, id) {
  const fb = world.net && world.net.fb;
  if (!fb || !world.net.uid) return;
  // ต้องแถม name/points ไปด้วยเสมอ — ผู้เล่นบางคนปลด title จากกาชา/ตกแต่งห้องได้โดยไม่เคยมีแต้ม
  // ขึ้น leaderboard เลย (เช่นยังไม่เคยตอบ quiz/ดวลชนะ) ทำให้ doc นี้ยังไม่เคยถูกสร้าง — .validate
  // ต้องเห็น name+points ครบในผลลัพธ์หลัง merge ไม่งั้น PERMISSION_DENIED
  fb.update(fb.ref(fb.db, `leaderboard/${world.net.uid}`), {
    name: world.player.name, points: world.quests.points, title: id || null,
  }).catch(() => {});
}

function render(world) {
  const dec = world.decor;
  ensureAchievements(dec);
  const a = dec.myHome.achievements;

  const cur = document.getElementById("achv-current");
  const ac = a.selected ? achievementById(a.selected) : null;
  cur.textContent = ac ? `ตำแหน่งปัจจุบัน: ${ac.icon} ${ac.name}` : "ยังไม่ได้เลือกตำแหน่งแสดง";

  const grid = document.getElementById("achv-grid");
  grid.textContent = "";
  for (const item of ACHIEVEMENTS) {
    const unlocked = a.unlocked.includes(item.id);
    const cell = document.createElement("div");
    cell.className = "achv-cell" + (unlocked ? " unlocked" : " locked") + (a.selected === item.id ? " selected" : "");
    const icon = document.createElement("div");
    icon.className = "achv-icon";
    icon.textContent = item.icon;
    const name = document.createElement("div");
    name.className = "achv-name";
    name.textContent = item.name;
    const prog = document.createElement("div");
    prog.className = "achv-progress";
    prog.textContent = unlocked ? "ปลดล็อกแล้ว ✓" : `${Math.min(a.stats[item.stat] || 0, item.target)}/${item.target}`;
    cell.append(icon, name, prog);
    if (unlocked) {
      cell.title = "กดเพื่อเลือก/ยกเลิกเป็นตำแหน่งแสดง";
      cell.addEventListener("click", () => selectTitle(world, a.selected === item.id ? null : item.id));
    }
    grid.appendChild(cell);
  }
}
