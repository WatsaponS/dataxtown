// เอฟเฟกต์ particle เล็ก ๆ เพิ่มความมันส์ตอนชนะดวล/ตอบควิซถูก/สุ่มกาชาได้ของหายาก
// วาดใน world-space (พิกัดอิงแผนที่ ไม่ใช่จอ) — เรียกจาก render.js ก่อน ctx.restore()

const MAX_PARTICLES = 60;
const GRAVITY = 220;
let particles = [];

// x,y = ตำแหน่งในโลกเกม (world-space) ที่จะให้ระเบิดออกมา
export function spawnBurst(x, y, opts = {}) {
  const count = opts.count ?? 18;
  const colors = opts.colors ?? ["#e7b94f", "#77b9b4", "#e2703a", "#57b06b"];
  const speed = opts.speed ?? 90;
  const life = opts.life ?? 0.7;
  const size = opts.size ?? 3;
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.6);
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, // เอียงพุ่งขึ้นนิดหน่อยให้ดูเป็นการระเบิด
      color: colors[Math.floor(Math.random() * colors.length)],
      life, maxLife: life,
      size: size * (0.7 + Math.random() * 0.6),
    });
  }
}

export function updateFx(world, dt) {
  if (!particles.length) return;
  particles = particles.filter(p => {
    p.life -= dt;
    if (p.life <= 0) return false;
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return true;
  });
}

export function drawFx(ctx) {
  if (!particles.length) return;
  for (const p of particles) {
    const t = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
