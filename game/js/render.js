// กล้อง + เรนเดอร์ทุกอย่างลง canvas หลัก

import { canHear, spriteFrame } from "./entities.js";
import { drawQuestMarkers } from "./quests.js";
import { drawPet } from "./pets.js";
import { petDisplayName } from "./pets_data.js";
import { getDuelPrompt } from "./duel.js";
import { drawGachaMachine, GACHA_Y } from "./gacha.js";
import { drawFx } from "./fx.js";

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
  drawables.push({ y: GACHA_Y + 12, draw: () => drawGachaMachine(ctx) }); // ตู้กาชา — ฐานอยู่ใต้จุดยืนเล็กน้อย
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();
  drawFx(ctx); // particle เอฟเฟกต์ — world-space เพื่อให้ยึดตำแหน่งบนแผนที่ถูก ไม่ลอยตามกล้อง
  ctx.restore();

  drawQuestMarkers(ctx, world, cam);

  // ป้ายชื่อ + bubble วาดใน screen space (คมชัดทุกระดับซูม)
  for (const ent of sorted) {
    const sxp = (ent.x - cam.x) * cam.zoom, syp = (ent.y - cam.y) * cam.zoom;
    drawNameTag(ctx, ent, sxp, syp - (config.frameH + 3) * cam.zoom, ent === p);
    if (ent.bubble && world.time < ent.bubble.until && canHear(world, p, ent)) {
      drawBubble(ctx, ent.bubble.text, sxp, syp - (config.frameH + 12) * cam.zoom);
    }
    if (ent.petId && ent.pet) {
      const psx = (ent.pet.x - cam.x) * cam.zoom, psy = (ent.pet.y - cam.y) * cam.zoom;
      drawPetTag(ctx, ent.petName || petDisplayName(ent.petId), psx, psy - (config.frameW + 2) * cam.zoom);
    }
  }

  drawDuelPrompt(ctx, world, cam);
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
  const col = spriteFrame(ent);
  // ent.sheet = spritesheet เฉพาะตัว (custom สี, 1 แถว) — ไม่มีก็ใช้ sheet รวมตาม variant
  const img = ent.sheet || world.sheetImg;
  const sx = col * config.frameW, sy = ent.sheet ? 0 : ent.variant * config.frameH;
  const dx = Math.round(ent.x - config.frameW / 2), dy = Math.round(ent.y - config.frameH + 1);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(dx + 3, Math.round(ent.y) - 2, 10, 3);
  ctx.drawImage(img, sx, sy, config.frameW, config.frameH, dx, dy, config.frameW, config.frameH);
}

function drawNameTag(ctx, ent, x, y, isPlayer) {
  ctx.font = "600 11px 'Segoe UI', 'Leelawadee UI', sans-serif";
  const w = ctx.measureText(ent.name).width + 10;
  ctx.fillStyle = "rgba(23,27,44,0.7)";
  roundRect(ctx, x - w / 2, y - 14, w, 14, 4);
  ctx.fill();
  ctx.fillStyle = isPlayer ? "#e7b94f" : "#fff6dc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ent.name, x, y - 7);
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
