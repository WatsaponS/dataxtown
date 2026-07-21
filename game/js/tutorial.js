// Tutorial Mode — 8 ภารกิจสอนระบบเกม ตรวจจับอัตโนมัติจากการเล่นจริง สำเร็จรับภารกิจละ 30 แต้ม
// สถานะเก็บใน homes/<uid>.tutorial = { <missionId>: true } (rules เดิม ไม่ต้องแก้)

import { addSystemLine } from "./ui.js";
import { awardPoints } from "./quests.js";
import { saveHome } from "./decor.js";
import { canHear } from "./entities.js";

export const MISSION_REWARD = 30;
const WALK_TARGET = 720; // px ≈ 15 tiles (2x จาก 360 — ตาม tile 24->48px)

export const MISSIONS = [
  { id: "walk",  icon: "🚶", title: "เดินสำรวจออฟฟิศ",       desc: "เดินด้วย WASD/ลูกศร (มือถือใช้ joystick) สักระยะ" },
  { id: "talk",  icon: "🗣️", title: "เข้าไปทักเพื่อนร่วมงาน", desc: "เดินเข้าใกล้ผู้บริหารจนอยู่ในระยะได้ยิน (วงรอบตัวคุณ)" },
  { id: "chat",  icon: "⌨️", title: "ส่งแชต 1 ข้อความ",       desc: "กด Enter (หรือปุ่ม 💬) พิมพ์แล้วส่ง" },
  { id: "quiz",  icon: "❓", title: "ทำ Quiz ให้จบ 1 รอบ",     desc: "เดินหาป้าย ❓ กด E แล้วตอบ 3 ข้อ" },
  { id: "board", icon: "🏆", title: "เปิดดู Leaderboard",      desc: "กดป้ายคะแนนมุมขวาบน หรือคีย์ L" },
  { id: "shop",  icon: "🛍️", title: "ซื้อไอเทม 1 ชิ้น",       desc: "ใช้แต้มช้อปของแต่งห้องที่ปุ่ม 🛍️" },
  { id: "place", icon: "🏠", title: "วางไอเทมในห้องของคุณ",   desc: "เปิดห้อง 🏠 เลือกของแล้วคลิกวาง" },
  { id: "login", icon: "🎁", title: "รับ Daily Login Reward",  desc: "กดรับของรางวัลประจำวันที่ปุ่ม 🎁" },
];

const tstate = dec => (dec.myHome.tutorial = dec.myHome.tutorial || {});

export function initTutorial(world, ui) {
  const dec = world.decor;
  const t = { lastX: world.player.x, lastY: world.player.y, walked: 0, ui };
  world.tutorial = t;

  // hooks จากระบบต่าง ๆ (แชตใช้วิธี wrap ต่อโซ่เหมือน net/ui)
  const prevChat = world.onChat;
  world.onChat = (ent, text) => {
    if (prevChat) prevChat(ent, text);
    if (ent === world.player) complete(world, ui, "chat");
  };
  world.onQuizDone = () => complete(world, ui, "quiz");
  world.onBoardOpen = () => complete(world, ui, "board");
  world.onShopBuy = () => complete(world, ui, "shop");
  world.onItemPlaced = () => complete(world, ui, "place");
  world.onLoginClaim = () => complete(world, ui, "login");

  document.getElementById("tutorial-btn").addEventListener("click", () => toggleTutorial(world, true));
  document.getElementById("tutorial-close").addEventListener("click", () => toggleTutorial(world, false));
  const overlay = document.getElementById("tutorial-overlay");
  overlay.addEventListener("click", e => { if (e.target === overlay) toggleTutorial(world, false); });

  // auto-open ตอนเข้าเกมถ้ายังทำไม่ครบ — รอให้ popup daily login ปิดก่อน ไม่แย่งกัน
  (dec.ready || Promise.resolve()).then(() => {
    if (doneCount(dec) >= MISSIONS.length) return;
    let opened = false;
    const tryOpen = () => {
      if (opened) return;
      if (!document.getElementById("login-overlay").classList.contains("hidden")) {
        setTimeout(tryOpen, 700);
        return;
      }
      opened = true;
      toggleTutorial(world, true);
    };
    setTimeout(tryOpen, 2200);
  });
}

// เรียกทุกเฟรมจาก game loop — ตรวจภารกิจ walk และ talk
export function updateTutorial(world) {
  const t = world.tutorial;
  if (!t || !world.decor) return;
  const dec = world.decor;
  const done = tstate(dec);
  const p = world.player;
  if (!done.walk) {
    const d = Math.hypot(p.x - t.lastX, p.y - t.lastY);
    t.walked += Math.min(d, 10); // กัน teleport นับรวดเดียว
    if (t.walked >= WALK_TARGET) complete(world, t.ui, "walk");
  }
  t.lastX = p.x; t.lastY = p.y;
  if (!done.talk) {
    for (const e of world.entities) {
      if (e.kind === "npc" && canHear(world, p, e)) { complete(world, t.ui, "talk"); break; }
    }
  }
}

function doneCount(dec) {
  const done = tstate(dec);
  return MISSIONS.filter(m => done[m.id]).length;
}

function complete(world, ui, id) {
  const dec = world.decor;
  if (!dec) return;
  const done = tstate(dec);
  if (done[id]) return;
  const mission = MISSIONS.find(m => m.id === id);
  if (!mission) return;
  done[id] = true;
  saveHome(world);
  awardPoints(world, MISSION_REWARD);
  const n = doneCount(dec);
  addSystemLine(ui, `🎓 ภารกิจ "${mission.title}" สำเร็จ! +${MISSION_REWARD} แต้ม (${n}/${MISSIONS.length})`);
  if (n >= MISSIONS.length) {
    addSystemLine(ui, `🎉 จบ tutorial ครบทุกภารกิจ! รับไปทั้งหมด ${MISSIONS.length * MISSION_REWARD} แต้ม — เก่งมาก!`);
  }
  if (!document.getElementById("tutorial-overlay").classList.contains("hidden")) render(world);
}

export function toggleTutorial(world, open) {
  document.getElementById("tutorial-overlay").classList.toggle("hidden", !open);
  if (open) render(world);
}

function render(world) {
  const dec = world.decor;
  const done = tstate(dec);
  const n = doneCount(dec);
  document.getElementById("tutorial-progress").textContent =
    `สำเร็จ ${n}/${MISSIONS.length} ภารกิจ · รับแล้ว ${n * MISSION_REWARD} แต้ม`;
  const list = document.getElementById("tutorial-list");
  list.textContent = "";
  for (const m of MISSIONS) {
    const row = document.createElement("div");
    row.className = "tutorial-row" + (done[m.id] ? " done" : "");
    const icon = document.createElement("span");
    icon.className = "tut-icon";
    icon.textContent = m.icon;
    const body = document.createElement("div");
    body.className = "tut-body";
    const title = document.createElement("div");
    title.className = "tut-title";
    title.textContent = m.title;
    const desc = document.createElement("div");
    desc.className = "tut-desc";
    desc.textContent = m.desc;
    body.append(title, desc);
    const reward = document.createElement("span");
    reward.className = "tut-reward";
    reward.textContent = done[m.id] ? "✓ +30" : "+30";
    row.append(icon, body, reward);
    list.appendChild(row);
  }
}
