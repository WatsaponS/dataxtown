// มอนสเตอร์ป่า — สุ่มโผล่บนแผนที่เป็นของประดับ (ไม่ชน ไม่ต้องเก็บ ไม่ผูกกับผู้เล่นคนอื่น
// ตั้งใจให้เป็นแค่บรรยากาศ client-local ล้วน ๆ เหมือน fx.js ไม่ sync ผ่าน Firebase) ครั้งละ
// SPAWN_COUNT ตัว ณ ตำแหน่งสุ่มที่เดินได้บนแผนที่ อยู่ LIFETIME วิ แล้วหายไปพร้อมกันทั้งชุด
// สุ่มชุดใหม่ต่อทันที — ระเบิด/หายมี fade สั้น ๆ กันดูสะดุดตา

import { tileBlocked } from "./world.js";
import { MONSTER_FRAME_W, MONSTER_FRAME_H, MONSTER_COUNT, MONSTER_DISPLAY_W, MONSTER_DISPLAY_H, monsterFrameRC } from "./monsters_data.js";

const SPAWN_COUNT = 5;
const LIFETIME = 10; // วินาที ก่อนหายทั้งชุด
const FADE = 0.4;     // วินาที fade in ตอนโผล่ / fade out ก่อนหาย

let monsterImg = null;
export function loadMonsterImage() {
  if (!monsterImg) { monsterImg = new Image(); monsterImg.src = "assets/monsters.png"; }
  return monsterImg;
}

// รายชื่อ tile ที่เดินได้ทั้งแผนที่ — คำนวณครั้งเดียวตอนแผนที่โหลด (ไม่เปลี่ยนระหว่างเล่น)
let walkableCache = null;
function walkableTiles(world) {
  if (walkableCache) return walkableCache;
  const list = [];
  const m = world.map;
  for (let ty = 0; ty < m.height; ty++) {
    for (let tx = 0; tx < m.width; tx++) {
      if (!tileBlocked(world, tx, ty)) list.push({ tx, ty });
    }
  }
  walkableCache = list;
  return list;
}

export function initWildMonsters(world) {
  world.wild = { list: [], timer: 0 };
  spawnWave(world);
}

function spawnWave(world) {
  const tiles = walkableTiles(world);
  if (!tiles.length) return;
  const t = world.tile;
  const list = [];
  for (let i = 0; i < SPAWN_COUNT; i++) {
    const tile = tiles[Math.floor(Math.random() * tiles.length)];
    list.push({
      monsterIndex: Math.floor(Math.random() * MONSTER_COUNT),
      x: (tile.tx + 0.5) * t,
      y: (tile.ty + 0.5) * t,
      age: 0,
      bobSeed: Math.random() * Math.PI * 2,
    });
  }
  world.wild.list = list;
  world.wild.timer = 0;
}

// เรียกทุกเฟรมจาก game loop
export function updateWildMonsters(world, dt) {
  if (!world.wild) { initWildMonsters(world); return; }
  world.wild.timer += dt;
  for (const m of world.wild.list) m.age += dt;
  if (world.wild.timer >= LIFETIME) spawnWave(world);
}

// วาดมอนสเตอร์ตัวเดียว — เรียกจาก render.js ในช่วง world-space (ระหว่าง drawables ที่ y-sort
// กับตัวละคร/สัตว์เลี้ยงอยู่แล้ว) รับ ctx แยกเป็นพารามิเตอร์ตามแพทเทิร์นเดียวกับ drawPet
export function drawWildMonster(ctx, m) {
  const img = monsterImg;
  if (!img || !img.complete || !img.naturalWidth) return;
  let alpha = 1;
  if (m.age < FADE) alpha = m.age / FADE;
  else {
    const remain = LIFETIME - m.age;
    if (remain < FADE) alpha = Math.max(0, remain / FADE);
  }
  if (alpha <= 0) return;
  const { col, row } = monsterFrameRC(m.monsterIndex);
  const bob = Math.sin(m.age * 2.2 + m.bobSeed) * 4;
  const w = MONSTER_DISPLAY_W, h = MONSTER_DISPLAY_H;
  const dx = Math.round(m.x - w / 2);
  const dy = Math.round(m.y - h + bob);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(m.x, m.y - 2, w * 0.28, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(img, col * MONSTER_FRAME_W, row * MONSTER_FRAME_H, MONSTER_FRAME_W, MONSTER_FRAME_H, dx, dy, w, h);
  ctx.restore();
}
