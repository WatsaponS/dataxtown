// กล้อง + เรนเดอร์ทุกอย่างลง canvas หลัก

import { canHear, spriteFrame } from "./entities.js";
import { drawQuestMarkers } from "./quests.js";
import { drawPet } from "./pets.js";
import { petDisplayName } from "./pets_data.js";
import { getDuelPrompt } from "./duel.js";
import { drawGachaMachine, GACHA_Y, SPRITE_Y_OFFSET } from "./gacha.js";
import { drawFx } from "./fx.js";
import { drawWildMonster } from "./monsters.js";
import { emoteEmoji } from "./emotes_data.js";
import { achievementById } from "./achievements_data.js";
import { teamById } from "./teams_data.js";
import { drawOutfitFrame } from "./outfit.js";
import { OUTFIT_FRAME_H } from "./outfit_data.js";
import { drawHiresCharacter, hiresAnchorHeight } from "./sprites.js";

export function makeCamera(config) {
  return { x: 0, y: 0, zoom: config.defaultZoom };
}

export function updateCamera(cam, world, canvas) {
  const vw = canvas.width / cam.zoom, vh = canvas.height / cam.zoom;
  cam.x = world.player.x - vw / 2;
  cam.y = world.player.y - vh / 2 - 8;
  cam.x = Math.max(0, Math.min(cam.x, world.pxW - vw));
  cam.y = Math.max(0, Math.min(cam.y, world.pxH - vh));
  if (world.pxW < vw) cam.x = (world.pxW - vw) / 2;
  if (world.pxH < vh) cam.y = (world.pxH - vh) / 2;
}

export function draw(ctx, world, cam) {
  const { config } = world;
  const canvas = ctx.canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#171b2c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));

  ctx.drawImage(world.mapImg, 0, 0);

  // วงรัศมีสนทนารอบผู้เล่น
  const p = world.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 8, config.proximityRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(231,185,79,0.07)";
  ctx.fill();
  ctx.strokeStyle = "rgba(231,185,79,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // วาดตัวละคร+สัตว์เลี้ยงเรียงตาม y รวมกัน (อะไรอยู่ล่างบังอันที่อยู่บน)
  const sorted = [...world.entities].sort((a, b) => a.y - b.y);
  const drawables = [];
  for (const ent of sorted) {
    drawables.push({ y: ent.y, draw: () => drawChar(ctx, world, ent) });
    if (ent.petId && ent.pet) drawables.push({ y: ent.pet.y, draw: () => drawPet(ctx, ent) });
  }
  drawables.push({ y: GACHA_Y + SPRITE_Y_OFFSET, draw: () => drawGachaMachine(ctx) }); // ตู้กาชา — ฐานอยู่ใต้จุดยืนเล็กน้อย
  if (world.wild) for (const m of world.wild.list) drawables.push({ y: m.y, draw: () => drawWildMonster(ctx, m) });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();
  drawFx(ctx); // particle เอฟเฟกต์ — world-space เพื่อให้ยึดตำแหน่งบนแผนที่ถูก ไม่ลอยตามกล้อง
  ctx.restore();

  drawQuestMarkers(ctx, world, cam);

  // ป้ายชื่อ + bubble วาดใน screen space (คมชัดทุกระดับซูม)
  // หลายคนยืนจุดเดียวกันพอดี (เช่น spawn point ตอนมีลิงก์แชร์เข้ามาพร้อมกัน) ป้ายชื่อจะซ้อนทับ
  // จนอ่านไม่ออก — จัดกลุ่มคนที่อยู่ใกล้กันมากบนจอ แล้วเลื่อนป้าย+bubble ขึ้นทีละชั้นตามลำดับ
  const TAG_CLUSTER_RADIUS = 24, TAG_STACK_GAP = 15;
  const screenPos = sorted.map(ent => ({ ent, sx: (ent.x - cam.x) * cam.zoom, sy: (ent.y - cam.y) * cam.zoom }));
  const stackIndex = new Map();
  for (let i = 0; i < screenPos.length; i++) {
    if (stackIndex.has(screenPos[i].ent)) continue;
    let n = 0;
    stackIndex.set(screenPos[i].ent, n++);
    for (let j = i + 1; j < screenPos.length; j++) {
      if (stackIndex.has(screenPos[j].ent)) continue;
      if (Math.hypot(screenPos[i].sx - screenPos[j].sx, screenPos[i].sy - screenPos[j].sy) < TAG_CLUSTER_RADIUS) {
        stackIndex.set(screenPos[j].ent, n++);
      }
    }
  }

  for (const { ent, sx: sxp, sy: syp } of screenPos) {
    const stackOffset = stackIndex.get(ent) * TAG_STACK_GAP;
    // ชุดคอสตูม/สไปรท์ความละเอียดสูงอาจสูงกว่าตัวละครฐาน — ป้าย/บับเบิลต้องขยับขึ้นเพิ่มตาม
    // ส่วนสูงที่เกินมา กันซ้อนหัว (outfit มาก่อนเพราะ drawChar วาดทับตัวละครฐานเสมอถ้าใส่อยู่)
    const extraH = extraTagHeight(ent, config) * cam.zoom;
    drawNameTag(ctx, ent, sxp, syp - (config.frameH + 3) * cam.zoom - stackOffset - extraH, ent === p, nameTagPrefix(world, ent));
    if (ent.online === false) {
      // ค้าง "Zzz.." ไว้ตลอด ไม่มี timeout/canHear เหมือน bubble แชตปกติ — ให้เห็นสถานะหลับ
      // จากระยะไกลได้เลย ไม่ต้องเดินเข้าใกล้
      drawBubble(ctx, "Zzz..", sxp, syp - (config.frameH + 12) * cam.zoom - stackOffset - extraH);
    } else if (ent.bubble && world.time < ent.bubble.until && canHear(world, p, ent)) {
      drawBubble(ctx, ent.bubble.text, sxp, syp - (config.frameH + 12) * cam.zoom - stackOffset - extraH);
    }
    if (ent.petId && ent.pet) {
      const psx = (ent.pet.x - cam.x) * cam.zoom, psy = (ent.pet.y - cam.y) * cam.zoom;
      drawPetTag(ctx, ent.petName || petDisplayName(ent.petId), psx, psy - (config.frameW + 2) * cam.zoom);
    }
    if (ent.emoteType && Date.now() < (ent.emoteUntil || 0)) {
      drawEmote(ctx, world, ent.emoteType, sxp, syp - (config.frameH + 20) * cam.zoom - stackOffset - extraH);
    }
  }

  drawDuelPrompt(ctx, world, cam);
}

// ส่วนสูงเกินมาจากตัวละครฐาน (config.frameH) ที่ต้องเผื่อให้ป้ายชื่อ/บับเบิล/อีโมทลอยพ้นหัว —
// outfit มาก่อนเสมอ (drawChar วาดทับตัวละครฐานถ้าใส่ชุดอยู่ไม่ว่าจะมี spriteId ด้วยหรือไม่)
function extraTagHeight(ent, config) {
  if (ent.outfit) return Math.max(0, OUTFIT_FRAME_H - config.frameH);
  if (ent.spriteId) {
    const h = hiresAnchorHeight(ent.spriteId);
    if (h != null) return Math.max(0, h - config.frameH);
  }
  return 0;
}

// ป้ายชวนดวลลอยเหนือหัวผู้เล่นที่เดินเข้าใกล้เรามากพอ (เดินตามคนนั้นไปด้วย + เด้งเรียกความสนใจ)
function drawDuelPrompt(ctx, world, cam) {
  const target = getDuelPrompt();
  if (!target) return;
  const ent = target.ent;
  const sxp = (ent.x - cam.x) * cam.zoom;
  const bob = Math.sin(world.time * 4) * 3;
  const syp = (ent.y - cam.y) * cam.zoom - (world.config.frameH + 32) * cam.zoom - bob;
  const text = "⚔️ กด F เพื่อท้าดวล";
  ctx.font = "700 12px 'Segoe UI', 'Leelawadee UI', sans-serif";
  const w = ctx.measureText(text).width + 18;
  const h = 23;
  ctx.fillStyle = "rgba(231,185,79,0.95)";
  roundRect(ctx, sxp - w / 2, syp - h / 2, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "#171b2c";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#171b2c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, sxp, syp + 1);
}

// อีโมทท่าทางลอยเด้งเหนือหัว — ใหญ่กว่าป้ายชื่อให้เห็นชัดจากระยะไกล
function drawEmote(ctx, world, type, x, y) {
  const emoji = emoteEmoji(type);
  if (!emoji) return;
  const bob = Math.sin(world.time * 6) * 4;
  ctx.font = "20px 'Segoe UI Emoji', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x, y - bob);
}

function drawPetTag(ctx, text, x, y) {
  ctx.font = "600 9px 'Segoe UI', 'Leelawadee UI', sans-serif";
  const w = ctx.measureText(text).width + 8;
  ctx.fillStyle = "rgba(23,27,44,0.55)";
  roundRect(ctx, x - w / 2, y - 11, w, 11, 4);
  ctx.fill();
  ctx.fillStyle = "#c9d4e3";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y - 5.5);
}

function drawChar(ctx, world, ent) {
  const config = world.config;
  // ตอน emote "jump" active — เด้งตัวขึ้นเป็นจังหวะ (เงายังอยู่พื้นเดิม ให้ดูเหมือนลอยขึ้นจริง)
  const jumping = ent.emoteType === "jump" && Date.now() < (ent.emoteUntil || 0);
  const hop = jumping ? Math.abs(Math.sin(world.time * 9)) * 6 : 0;
  // ขนาดเงาคิดสัดส่วนจาก frameW (แทนเลขคงที่ที่จูนไว้กับสไปรท์ 16px เดิม) กันเงาดูเล็ก/ใหญ่ผิดสัดส่วน
  // ถ้าเปลี่ยนขนาดสไปรท์อีกในอนาคต — ใช้ config.frameW เดิมเสมอ ไม่ว่าจะใส่ชุดคอสตูมหรือไม่
  // (เงาอยู่ที่จุดเท้า ไม่ขึ้นกับความสูงสไปรท์)
  const shadowW = Math.round(config.frameW * 0.62), shadowH = Math.max(3, Math.round(config.frameH * 0.06));
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(Math.round(ent.x - shadowW / 2), Math.round(ent.y) - 2, shadowW, shadowH);
  const asleep = ent.online === false;
  // คนที่หลุด/ปิดแท็บไปแล้ว — จางลง + ลดสีเกือบขาวดำ ให้ดูออกชัดเจนว่าไม่ได้อยู่จริง (จางอย่างเดียว
  // แยกยากตอนอยู่ในโหมดปกติ เทียบกับคนที่แค่ยืนนิ่งเฉย ๆ)
  if (asleep) { ctx.globalAlpha = 0.65; ctx.filter = "grayscale(80%)"; }
  // ลำดับความสำคัญ: ชุดคอสตูม (ครอบทับทั้งตัว) > สไปรท์ความละเอียดสูง (ถ้าเลือกไว้และโหลดสำเร็จ)
  // > avatar เดิม (fallback เสมอถ้าอีกสองอย่างไม่วาดอะไรเลย — ไม่มีทาง crash/จอว่าง)
  if (!drawOutfitFrame(ctx, ent, hop) && !drawHiresCharacter(ctx, ent, hop)) {
    const col = spriteFrame(ent);
    // ent.sheet = spritesheet เฉพาะตัว (custom สี, 1 แถว) — ไม่มีก็ใช้ sheet รวมตาม variant
    const img = ent.sheet || world.sheetImg;
    const sx = col * config.frameW, sy = ent.sheet ? 0 : ent.variant * config.frameH;
    const dx = Math.round(ent.x - config.frameW / 2), dy = Math.round(ent.y - config.frameH + 1 - hop);
    ctx.drawImage(img, sx, sy, config.frameW, config.frameH, dx, dy, config.frameW, config.frameH);
  }
  if (asleep) { ctx.globalAlpha = 1; ctx.filter = "none"; }
}

// ตำแหน่ง (title) + ทีม ที่เลือกไว้ — ของตัวเองอ่านตรงจาก decor/player state, ของคนอื่นอ่านจาก leaderboard
// (mirror มาให้ตอนเลือก title / ตอนบันทึกแต้มใน achievements.js/quests.js กัน round-trip เพิ่ม)
function nameTagPrefix(world, ent) {
  let titleIcon = null, teamEmoji = null;
  if (ent === world.player) {
    const sel = world.decor && world.decor.myHome && world.decor.myHome.achievements && world.decor.myHome.achievements.selected;
    const ac = sel && achievementById(sel);
    titleIcon = ac ? ac.icon : null;
    const team = ent.dept && teamById(ent.dept);
    teamEmoji = team ? team.emoji : null;
  } else if (ent.id && ent.id.startsWith("remote_") && world.quests && world.quests.board) {
    const row = world.quests.board[ent.id.slice(7)];
    const ac = row && row.title && achievementById(row.title);
    titleIcon = ac ? ac.icon : null;
    const team = row && row.dept && teamById(row.dept);
    teamEmoji = team ? team.emoji : null;
  }
  return [teamEmoji, titleIcon].filter(Boolean).join(" ");
}

function drawNameTag(ctx, ent, x, y, isPlayer, prefix) {
  const label = prefix ? `${prefix} ${ent.name}` : ent.name;
  ctx.font = "600 11px 'Segoe UI', 'Leelawadee UI', sans-serif";
  const w = ctx.measureText(label).width + 10;
  ctx.fillStyle = "rgba(23,27,44,0.7)";
  roundRect(ctx, x - w / 2, y - 14, w, 14, 4);
  ctx.fill();
  ctx.fillStyle = isPlayer ? "#e7b94f" : "#fff6dc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y - 7);
}

function drawBubble(ctx, text, x, y) {
  ctx.font = "13px 'Segoe UI', 'Leelawadee UI', sans-serif";
  const maxW = 200;
  const lines = wrapText(ctx, text, maxW);
  const w = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width))) + 16;
  const h = lines.length * 17 + 10;
  const bx = x - w / 2, by = y - h - 8;
  ctx.fillStyle = "rgba(255,246,220,0.95)";
  roundRect(ctx, bx, by, w, h, 7);
  ctx.fill();
  // หางลูกโป่ง
  ctx.beginPath();
  ctx.moveTo(x - 5, by + h); ctx.lineTo(x + 5, by + h); ctx.lineTo(x, by + h + 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#171b2c";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => ctx.fillText(l, x, by + 6 + i * 17));
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const wd of words) {
    const test = cur ? cur + " " + wd : wd;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
