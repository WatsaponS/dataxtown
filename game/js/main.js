// Bootstrap + game loop ของ DataX Town

import { CONFIG, NPCS, HAIR_COLORS, SHIRT_COLORS } from "./data.js";
import { loadWorld, spawnPoint, zoneAt } from "./world.js";
import { makeEntity, updatePlayer, updateNPC } from "./entities.js";
import { makeCustomSheet } from "./avatar.js";
import { connectNet, updateRemotes } from "./net.js";
import { connectFirebase } from "./net_firebase.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";
import { createMusic } from "./audio.js";
import { initQuests, updateQuests, tryStartQuiz, isQuizOpen, toggleBoard } from "./quests.js";
import { initHistory, toggleHistory } from "./history.js";
import { initDecor, toggleShop, toggleRoom } from "./decor.js";
import { initLoginRewards, toggleLogin } from "./login_rewards.js";
import { initTutorial, updateTutorial, toggleTutorial } from "./tutorial.js";
import { setPet, updatePets, loadPetImage } from "./pets.js";
import { PETS, PET_FRAME, petIconRow } from "./pets_data.js";
import { initPetMenu, togglePetMenu } from "./pet_menu.js";
import { initDuel, updateDuelProximity, tryDuelNearby } from "./duel.js";
import { initGacha, updateGachaProximity, toggleGacha, isNearGacha, loadGachaMachineImage } from "./gacha.js";
import { updateFx } from "./fx.js";
import { initEmotes, toggleEmotePanel, isEmotePanelOpen } from "./emotes.js";
import { initAchievements, toggleAchievements } from "./achievements.js";
import { initMissions, toggleMissions } from "./missions.js";
import { TEAMS } from "./teams_data.js";
import { loadOutfitsImage } from "./outfit.js";
import { initOutfitMenu, toggleOutfitMenu } from "./outfit_menu.js";
import { preloadSprite, drawSpritePreview } from "./sprites.js";
import { getSpriteDef } from "./sprites_manifest.js";
import { makeCamera, updateCamera, draw } from "./render.js";
import {
  setupUI, isChatOpen, toggleChat, submitChat,
  updateZoneBanner, drawMinimap, refreshOnlineList, addSystemLine,
} from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = new Set();
const joy = { x: 0, y: 0, active: false };
const controls = { keys: input, joy };

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// ฟอร์มสร้างตัวละครใน #start-card ดูพร้อมกดได้ทันทีตั้งแต่ HTML แสดงผล แต่ event listener
// ทั้งหมดผูกหลัง loadWorld() resolve เท่านั้น — โชว์การ์ด "กำลังโหลด..." บังไว้ก่อน กันผู้เล่นกด
// ฟอร์มที่ยังไม่ทำงานจริงเงียบ ๆ (โดยเฉพาะถ้า fetch ค้างจาก wifi ไม่เสถียร ดู timeout ใน world.js)
let world;
try {
  world = await loadWorld(CONFIG);
} catch (err) {
  console.error("loadWorld failed:", err);
  document.getElementById("start-loading-spinner").style.display = "none";
  document.getElementById("start-loading-text").textContent = `โหลดไม่สำเร็จ: ${err.message}`;
  const retryBtn = document.getElementById("start-loading-retry");
  retryBtn.classList.remove("hidden");
  retryBtn.addEventListener("click", () => location.reload());
  throw err; // หยุดโค้ดที่เหลือทั้งไฟล์ — ทุกอย่างข้างล่างพึ่ง world ต้องไม่รันถ้าโหลดไม่สำเร็จ
}
document.getElementById("start-loading-card").classList.add("hidden");
document.getElementById("start-card").classList.remove("hidden");
const cam = makeCamera(CONFIG);
let ui = null;

// ---------- เพลงประกอบ ----------
const music = createMusic();
const musicBtn = document.getElementById("music-btn");
const updateMusicBtn = () => { musicBtn.textContent = music.isMuted() ? "🔇" : "🎵"; };
musicBtn.addEventListener("click", () => { music.toggle(); updateMusicBtn(); });
updateMusicBtn();
// autoplay ต้องรอ gesture แรก (คลิก/แตะ/กดคีย์) — เรียกซ้ำได้ ไม่มีผลข้างเคียง
window.addEventListener("pointerdown", () => music.start(), { once: true });
window.addEventListener("keydown", () => music.start(), { once: true });
window.__music = music; // hooks สำหรับ automated test ผ่าน cdp_shot --eval
window.__world = world;
const petImg = loadPetImage(); // โหลดคู่ขนานไปเลย ไม่ต้องรอ
loadGachaMachineImage();
loadOutfitsImage();

// ---------- หน้าจอเริ่มเกม: ชื่อ + เพศ + สีผม/สีเสื้อ ----------
// สไปรท์ต้นฉบับมีแค่ชาย/หญิงอย่างละ 1 แบบ (variant 0/1) ต่างคนต่างสีผ่าน mask recolor
// ล้วน ๆ — ไม่มี "เลือกตัวละคร" (variant สี) แบบเดิมอีกต่อไป เพราะเปลี่ยนสีได้อิสระกว่าเดิมแล้ว
const saved = JSON.parse(localStorage.getItem("dataxtown.avatar") || "null") || {};
// clamp กัน localStorage เก่าที่เคยเก็บ variant แบบ 0-15 (ระบบสีแบบเดิม) ให้ไม่หลุดขอบ 0/1
let chosenGender = Math.min(1, Math.max(0, saved.variant ?? Math.round(Math.random())));
let chosenHair = saved.hair ?? null;    // null = สีเดิมของสไปรท์ต้นฉบับ
let chosenShirt = saved.shirt ?? null;
let chosenPet = saved.pet ?? null;      // null = ไม่มีสัตว์เลี้ยง
let chosenOutfit = saved.outfit ?? null; // null = ไม่ใส่ชุดคอสตูม ใช้ตัวละครเดิม
// null = ใช้ระบบ avatar เดิม (32x50, recolor ได้) — ตั้งค่านี้ = ใช้สไปรท์ความละเอียดสูงแทนทั้งตัว
// (ดู sprites_manifest.js) เลือกได้จาก #hires-picker ในหน้าสร้างตัวละคร คนละระบบกับ outfit
// (outfit ใส่ทับ avatar ทีหลังได้เสมอในเกม ส่วนอันนี้คือ "ตัวละครฐาน" ตั้งแต่ตอนสร้างเลย)
let chosenSpriteId = saved.spriteId ?? null;
const HIRES_PREVIEW_BOX = 96; // กล่องพรีวิวใหญ่ (#avatar-preview) สี่เหลี่ยมจัตุรัส — contain-fit
if (chosenSpriteId) preloadSprite(chosenSpriteId); // โหลดล่วงหน้าให้พรีวิวหน้าสร้างตัวละครไวขึ้น
let chosenPetName = saved.petName ?? "";
let chosenDept = saved.dept ?? TEAMS[Math.floor(Math.random() * TEAMS.length)].id; // สุ่มทีมให้ครั้งแรก เปลี่ยนได้เสมอ
if (saved.name) document.getElementById("name-input").value = saved.name;

const variantIndex = () => chosenGender;
const genderPicker = document.getElementById("gender-picker");

function refreshGenderButtons() {
  genderPicker.querySelectorAll("button").forEach(b =>
    b.classList.toggle("selected", Number(b.dataset.gender) === chosenGender));
}
genderPicker.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  chosenGender = Number(b.dataset.gender);
  refreshGenderButtons();
  updatePreview();
}));
refreshGenderButtons();

// แถบสี: ช่องแรก (✕) = กลับไปใช้สีเดิมของตัวละคร
function buildSwatchRow(elId, colors, getValue, setValue) {
  const row = document.getElementById(elId);
  const options = [null, ...colors];
  for (const color of options) {
    const sw = document.createElement("div");
    sw.className = "sw" + (color === null ? " auto" : "");
    if (color) sw.style.background = color;
    if (color === getValue()) sw.classList.add("selected");
    sw.addEventListener("click", () => {
      row.querySelectorAll(".sw").forEach(el => el.classList.remove("selected"));
      sw.classList.add("selected");
      setValue(color);
      updatePreview();
    });
    row.appendChild(sw);
  }
  if (!row.querySelector(".selected")) row.firstChild.classList.add("selected");
}
buildSwatchRow("hair-picker", HAIR_COLORS, () => chosenHair, c => { chosenHair = c; });
buildSwatchRow("shirt-picker", SHIRT_COLORS, () => chosenShirt, c => { chosenShirt = c; });

// ---------- เลือกทีม ----------
const teamPicker = document.getElementById("team-picker");
function buildTeamPicker() {
  teamPicker.textContent = "";
  TEAMS.forEach(team => {
    const opt = document.createElement("div");
    opt.className = "team-opt" + (chosenDept === team.id ? " selected" : "");
    opt.style.setProperty("--team-color", team.color);
    const emoji = document.createElement("span");
    emoji.className = "team-emoji";
    emoji.textContent = team.emoji;
    const label = document.createElement("span");
    label.textContent = team.name;
    opt.append(emoji, label);
    opt.addEventListener("click", () => { chosenDept = team.id; refreshTeamPicker(); });
    teamPicker.appendChild(opt);
  });
}
function refreshTeamPicker() {
  [...teamPicker.children].forEach((el, i) => el.classList.toggle("selected", TEAMS[i].id === chosenDept));
}
buildTeamPicker();

// ---------- ตัวเลือกสัตว์เลี้ยง ----------
const petPicker = document.getElementById("pet-picker");
const petNameInput = document.getElementById("pet-name-input");
petNameInput.value = chosenPetName;
petNameInput.addEventListener("input", () => { chosenPetName = petNameInput.value.trim().slice(0, 16); });
function drawPetIcon(canvas, petIndex) {
  const cc = canvas.getContext("2d");
  cc.imageSmoothingEnabled = false;
  const draw = () => cc.drawImage(petImg, 0, petIconRow(PETS[petIndex].id) * PET_FRAME, PET_FRAME, PET_FRAME, 0, 0, PET_FRAME, PET_FRAME);
  if (petImg.complete) draw();
  else petImg.addEventListener("load", draw, { once: true });
}
function buildPetPicker() {
  petPicker.textContent = "";
  const none = document.createElement("div");
  none.className = "pet-opt none-opt" + (chosenPet ? "" : " selected");
  none.innerHTML = '<span class="pet-emoji">🚫</span><span>ไม่มี</span>';
  none.addEventListener("click", () => { chosenPet = null; refreshPetPicker(); });
  petPicker.appendChild(none);
  PETS.forEach((pet, i) => {
    const opt = document.createElement("div");
    opt.className = "pet-opt" + (chosenPet === pet.id ? " selected" : "");
    opt.dataset.pet = pet.id;
    const c = document.createElement("canvas");
    c.width = PET_FRAME; c.height = PET_FRAME;
    drawPetIcon(c, i);
    const label = document.createElement("span");
    label.textContent = `${pet.emoji} ${pet.name}`;
    opt.append(c, label);
    opt.addEventListener("click", () => { chosenPet = pet.id; refreshPetPicker(); });
    petPicker.appendChild(opt);
  });
}
function refreshPetPicker() {
  petPicker.querySelectorAll(".pet-opt").forEach(el => {
    el.classList.toggle("selected", (el.dataset.pet || null) === chosenPet);
  });
  petNameInput.classList.toggle("hidden", !chosenPet);
}
buildPetPicker();
refreshPetPicker();

// หน้าสร้างตัวละครไม่มี UI เลือกสไปรท์ความละเอียดสูงแล้ว (ย้ายไปเลือกเป็น "ชุด" ในเกมแทนทั้งหมด
// ผ่านเมนู 👕 — ดู outfit_menu.js) เหลือแค่ตัวละครฐานเดิม (avatar ธรรมดา) ให้เลือกตอนสร้างตัวละคร
// chosenSpriteId ยังอยู่เผื่อ backward-compat กับ localStorage เก่า/พารามิเตอร์ ?sprite= (ใช้เทส)
// แต่ไม่มีทางตั้งค่าจาก UI ปกติได้อีกแล้ว
function updatePreview() {
  const canvas = document.getElementById("avatar-preview");
  document.getElementById("custom-cols").classList.toggle("hidden", !!chosenSpriteId);
  if (chosenSpriteId) {
    // ขนาดจริง (attribute) ต้องตรงกับขนาดแสดงผล (CSS) เป๊ะ กันภาพถูกยืด/บีบสัดส่วนตอนเบราว์เซอร์
    // scale ให้พอดีกล่อง — โหมด avatar ปกติใช้ CSS ที่ตั้งไว้ล่วงหน้า (64x96) ไม่ต้องยุ่ง inline style
    canvas.width = HIRES_PREVIEW_BOX; canvas.height = HIRES_PREVIEW_BOX;
    canvas.style.width = HIRES_PREVIEW_BOX + "px"; canvas.style.height = HIRES_PREVIEW_BOX + "px";
    const draw = () => drawSpritePreview(canvas.getContext("2d"), canvas, chosenSpriteId, "down");
    draw();
    preloadSprite(chosenSpriteId).then(draw); // เผื่อยังโหลดไม่เสร็จตอนกดเลือกครั้งแรก
    return;
  }
  canvas.width = CONFIG.frameW; canvas.height = CONFIG.frameH;
  canvas.style.width = ""; canvas.style.height = ""; // กลับไปใช้ CSS เดิม (#avatar-preview)
  const sheet = makeCustomSheet(world, variantIndex(), { hair: chosenHair, shirt: chosenShirt });
  const pc = canvas.getContext("2d");
  pc.imageSmoothingEnabled = false;
  pc.clearRect(0, 0, CONFIG.frameW, CONFIG.frameH);
  pc.drawImage(sheet, 0, 0, CONFIG.frameW, CONFIG.frameH, 0, 0, CONFIG.frameW, CONFIG.frameH);
}
updatePreview();

document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("name-input").addEventListener("keydown", e => {
  if (e.key === "Enter") startGame();
});

// เปิดเกมข้าม overlay: index.html?autostart=1&name=Test&hair=c94f4f&shirt=2e6b4f (hex ไม่ต้องใส่ #)
const params = new URLSearchParams(location.search);
if (params.get("hair")) chosenHair = "#" + params.get("hair").replace("#", "");
if (params.get("shirt")) chosenShirt = "#" + params.get("shirt").replace("#", "");
if (params.get("pet")) chosenPet = params.get("pet") === "none" ? null : params.get("pet");
if (params.get("petname")) chosenPetName = params.get("petname");
if (params.get("dept")) chosenDept = params.get("dept");
// ?sprite=rosewind_healer_v2 (หรือ "none" กลับไปใช้ avatar เดิม) — เทสอัตโนมัติผ่าน cdp_shot ได้
// โดยไม่ต้องคลิก UI เอง เหมือน ?hair=/?shirt= เดิม
if (params.get("sprite")) {
  const sid = params.get("sprite");
  chosenSpriteId = sid === "none" ? null : sid;
  if (chosenSpriteId) preloadSprite(chosenSpriteId);
}
if (params.get("autostart")) {
  document.getElementById("name-input").value = params.get("name") || "Tester";
  startGame();
}

// &settle=6000 หน่วง load event ด้วยเวลาจริง — ใช้คู่กับ headless screenshot
// เพื่อให้ WebSocket/realtime มีเวลาทำงานก่อนภาพถูกถ่าย (อย่าใช้กับ --virtual-time-budget)
const settleMs = parseInt(params.get("settle") || "0", 10);
if (settleMs > 0) await new Promise(r => setTimeout(r, settleMs));

function startGame() {
  const name = document.getElementById("name-input").value.trim() || "Guest";
  document.getElementById("start-overlay").classList.add("hidden");

  const sp = spawnPoint(world, new URLSearchParams(location.search).get("spawn") || "main_entrance");
  world.player = makeEntity({ id: "player", name, variant: variantIndex(), x: sp.x, y: sp.y, kind: "player" });
  world.player.hair = chosenHair;
  world.player.shirt = chosenShirt;
  world.player.dept = chosenDept;
  if (chosenHair || chosenShirt) {
    world.player.sheet = makeCustomSheet(world, variantIndex(), { hair: chosenHair, shirt: chosenShirt });
  }
  setPet(world.player, chosenPet, chosenPetName); // เรียกก่อน connect net ให้ payload join มี pet ติดไปด้วย
  world.player.outfit = chosenOutfit;
  // สไปรท์ความละเอียดสูง (ถ้าเลือกไว้) — ตั้ง collision footprint จาก manifest แยกจาก
  // displayWidth/Height เสมอ (ดู entities.js moveEntity) กันขนาดภาพกระทบ hitbox
  world.player.spriteId = chosenSpriteId;
  if (chosenSpriteId) {
    preloadSprite(chosenSpriteId);
    const def = getSpriteDef(chosenSpriteId);
    if (def) { world.player.collisionW = def.collisionWidth; world.player.collisionH = def.collisionHeight; }
  }
  world.entities.push(world.player);
  localStorage.setItem("dataxtown.avatar", JSON.stringify({
    name, variant: variantIndex(), hair: chosenHair, shirt: chosenShirt,
    pet: chosenPet, petName: chosenPetName, dept: chosenDept, outfit: chosenOutfit,
    spriteId: chosenSpriteId,
  }));

  for (const n of NPCS) {
    const ent = makeEntity({
      id: "npc_" + n.name, name: n.name, role: n.role, variant: n.variant,
      x: (n.home[0] + 0.5) * world.tile, y: (n.home[1] + 0.5) * world.tile,
    });
    ent.home = [ent.x, ent.y];
    ent.roam = n.roam;
    ent.lines = n.lines;
    ent.duelWinRate = n.duelWinRate;
    if (n.roomBox) ent.roomBox = n.roomBox.map(v => v * world.tile);
    if (n.hair || n.shirt) ent.sheet = makeCustomSheet(world, n.variant, { hair: n.hair, shirt: n.shirt });
    // เผื่ออนาคตอยาก assign สไปรท์ความละเอียดสูงให้ NPC บางคน (data.js เพิ่ม n.spriteId เข้าไป) —
    // ไม่มี NPC ไหนใช้ตอนนี้ (ทุกคนยังเป็นระบบ avatar เดิม) โค้ดนี้เป็น no-op จนกว่าจะมีคนตั้งค่า
    if (n.spriteId) {
      ent.spriteId = n.spriteId;
      preloadSprite(n.spriteId); // เฉพาะ NPC ที่อยู่ในฉากจริงเท่านั้น (ไม่ preload สไปรท์ทั้งระบบ)
      const def = getSpriteDef(n.spriteId);
      if (def) { ent.collisionW = def.collisionWidth; ent.collisionH = def.collisionHeight; }
    }
    world.entities.push(ent);
  }

  ui = setupUI(world);
  refreshOnlineList(ui, world);
  addSystemLine(ui, `ยินดีต้อนรับสู่ DataX ชั้น 7 คุณ ${name} 👋 เดินเข้าใกล้เพื่อนร่วมงานเพื่อคุยกัน`);
  // มี Firebase config = multiplayer ผ่าน cloud (URL ถาวร, ไม่ต้องมีเซิร์ฟเวอร์เอง)
  // ไม่มี = ใช้ WebSocket server ในเครื่อง (server.py) แบบเดิม
  const netReady = FIREBASE_CONFIG
    ? connectFirebase(world, ui)
    : Promise.resolve(connectNet(world, ui));
  netReady.then(() => {
    initQuests(world, ui); // quest ต้องรอ net เพื่อผูก leaderboard
    initHistory(world, ui);
    initDecor(world, ui);  // ร้านค้า + ห้องส่วนตัว (ใช้แต้มจาก quests และ uid จาก net)
    initLoginRewards(world, ui); // daily login 30 วัน (popup อัตโนมัติเมื่อมีของให้รับ)
    initTutorial(world, ui);     // ภารกิจแนะนำเกม 8 อย่าง ภารกิจละ 30 แต้ม
    initAchievements(world, ui); // ความสำเร็จ+ตำแหน่งแสดง — ต้องมาหลัง tutorial กันทับ hook onItemPlaced
    initMissions(world, ui);     // ภารกิจประจำวัน 3 อัน + streak — ต้องมาหลัง tutorial/achievements เหมือนกัน
    initPetMenu(world, ui);      // เมนู 🐾 เปลี่ยน/ตั้งชื่อสัตว์เลี้ยง + สัตว์ legendary จาก login
    initDuel(world, ui);         // ท้าเป่ายิ้งฉุบผู้เล่นออนไลน์ ชนะ 2 ใน 3 ได้ 20 แต้ม
    initGacha(world, ui);        // ตู้กาชาปอง — สุ่มไอเทม exclusive 100 แต้ม/ครั้ง
    initEmotes(world, ui);       // ปุ่มท่าทาง (V) — โบกมือ/ปรบมือ/ฯลฯ เห็นได้ทุกคนใกล้เคียง
    initOutfitMenu(world, ui);   // เมนู 👕 ใส่/ถอดชุดคอสตูมเต็มตัว ฟรี เห็นได้ทุกคนใกล้เคียง
  });
  requestAnimationFrame(loop);
}

// ---------- คีย์บอร์ด ----------
window.addEventListener("keydown", e => {
  if (!world.player) return;
  if (ui && isChatOpen(ui)) {
    if (e.key === "Enter") submitChat(ui, world);
    if (e.key === "Escape") toggleChat(ui, world, false);
    return;
  }
  if (e.key === "Enter") { toggleChat(ui, world, true); e.preventDefault(); return; }
  if (e.code === "Equal" || e.key === "+") cam.zoom = Math.min(4, cam.zoom + 1);
  if (e.code === "Minus" || e.key === "-") cam.zoom = Math.max(1, cam.zoom - 1);
  if (e.code === "KeyM") document.getElementById("minimap").classList.toggle("hidden");
  if (e.code === "KeyB") { music.toggle(); updateMusicBtn(); }
  if (e.code === "KeyE" && !isQuizOpen(world)) tryStartQuiz(world, ui);
  if (e.code === "KeyF") tryDuelNearby(world, ui);
  if (e.code === "KeyG" && isNearGacha()) toggleGacha(world, document.getElementById("gacha-overlay").classList.contains("hidden"));
  if (e.code === "KeyL") toggleBoard(world, document.getElementById("board-overlay").classList.contains("hidden"));
  if (e.code === "KeyH") toggleHistory(world, document.getElementById("history-overlay").classList.contains("hidden"));
  if (e.code === "KeyV") toggleEmotePanel(!isEmotePanelOpen());
  if (e.key === "Escape") {
    toggleBoard(world, false); toggleHistory(world, false);
    toggleShop(world, false); toggleRoom(world, false); toggleLogin(world, false);
    toggleTutorial(world, false); togglePetMenu(world, false); toggleGacha(world, false);
    toggleEmotePanel(false); toggleAchievements(world, false); toggleMissions(world, false);
    toggleOutfitMenu(world, false);
    // Esc บนคำท้าที่เข้ามา = ปฏิเสธจริง (ไม่ใช่แค่ซ่อน) กันสถานะ duel ค้างในหน่วยความจำ
    if (!document.getElementById("duel-incoming-overlay").classList.contains("hidden")) {
      document.getElementById("duel-decline-btn").click();
    }
  }
  input.add(e.code);
});
window.addEventListener("keyup", e => input.delete(e.code));
window.addEventListener("blur", () => input.clear());

// ---------- จอสัมผัส: virtual joystick + ปุ่มแชต ----------
const isTouch = new URLSearchParams(location.search).get("touch") === "1"
  || matchMedia("(pointer: coarse)").matches;
if (isTouch) {
  document.body.classList.add("touch");
  const joyEl = document.getElementById("joystick");
  const stickEl = document.getElementById("stick");
  const joyHintEl = document.getElementById("joy-hint");
  setTimeout(() => joyHintEl.classList.add("hidden"), 8000); // เผื่อไม่ได้แตะจอย ก็ไม่ค้างบังจอตลอด
  let joyPointer = null;

  const updateStick = e => {
    const rect = joyEl.getBoundingClientRect();
    const r = rect.width / 2;
    let jx = (e.clientX - (rect.left + r)) / r;
    let jy = (e.clientY - (rect.top + r)) / r;
    const mag = Math.hypot(jx, jy);
    if (mag > 1) { jx /= mag; jy /= mag; }
    joy.x = jx; joy.y = jy; joy.active = true;
    stickEl.style.transform = `translate(calc(-50% + ${jx * r * 0.55}px), calc(-50% + ${jy * r * 0.55}px))`;
    stickEl.classList.toggle("running", Math.hypot(jx, jy) > 0.9); // ดันสุดขอบ = วิ่ง (ตรงกับ threshold ใน entities.js)
  };
  const resetStick = () => {
    joyPointer = null;
    joy.x = 0; joy.y = 0; joy.active = false;
    stickEl.style.transform = "translate(-50%, -50%)";
    stickEl.classList.remove("running");
  };
  joyEl.addEventListener("pointerdown", e => {
    joyPointer = e.pointerId;
    joyEl.setPointerCapture(e.pointerId);
    updateStick(e);
    joyHintEl.classList.add("hidden"); // ใช้จอยครั้งแรกแล้ว ไม่ต้องเตือนซ้ำ
    e.preventDefault();
  });
  joyEl.addEventListener("pointermove", e => {
    if (e.pointerId === joyPointer) updateStick(e);
  });
  joyEl.addEventListener("pointerup", resetStick);
  joyEl.addEventListener("pointercancel", resetStick);

  document.getElementById("chat-btn").addEventListener("click", () => {
    if (!ui) return;
    if (isChatOpen(ui)) submitChat(ui, world);
    else toggleChat(ui, world, true);
  });
}

// ---------- Game loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  world.time += dt;

  if (!isChatOpen(ui) && !isQuizOpen(world)) updatePlayer(world, controls, dt);
  for (const ent of world.entities) if (ent.kind === "npc") updateNPC(world, ent, dt);
  updateRemotes(world, dt);
  updatePets(world, dt);
  updateQuests(world);
  updateTutorial(world);
  updateDuelProximity(world); // เดินเข้าใกล้ผู้เล่นอื่น = ขึ้นป้ายชวนดวลเหนือหัวเขา (กด F ท้า)
  updateGachaProximity(world); // เดินเข้าใกล้ตู้กาชา = ขึ้นป้ายกด G
  updateFx(world, dt);
  music.setZone(zoneAt(world, world.player.x, world.player.y)); // เพลงเปลี่ยนตามโซน

  updateCamera(cam, world, canvas);
  draw(ctx, world, cam);
  updateZoneBanner(ui, world);
  drawMinimap(ui, world);

  requestAnimationFrame(loop);
}
