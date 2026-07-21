// Palette-swap ตัวละคร: สร้าง spritesheet เฉพาะตัว (1 แถว 12 เฟรม) จาก variant ต้นแบบ
// โดยแทนสีผม/สีเสื้อด้วยสีที่ผู้เล่นเลือก — เสื้อ/ผมตอนนี้มีเฉด 3 โทน (lo/mid/hi) จาก
// ramp() ไม่ใช่สีแบนราบเดียวเหมือนเดิม จึงต้อง swap ทั้ง 3 โทนให้ตรงกับที่วาดไว้ใน avatars.png
// (ramp() นี้พอร์ตมาจาก pixel-art/.../pixelstudio.py แบบตรงตัวสูตร เพื่อให้สีที่คำนวณสดใน
// เบราว์เซอร์ตรงกับสีที่ build_avatars.py คำนวณไว้ตอน build)

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function toward(h, target, amount) {
  const diff = ((target - h + 180) % 360 + 360) % 360 - 180;
  const step = Math.max(-amount, Math.min(amount, diff));
  return ((h + step) % 360 + 360) % 360;
}

// เฉดไล่โทน 3 สเต็ป (มืด->กลาง->สว่าง) หมุน hue จริง (เงาเอียงน้ำเงิน ไฮไลต์เอียงเหลือง)
// ต้องตรงสูตรกับ ramp() ฝั่ง Python เป๊ะ ๆ เพื่อให้ exact-match swap เจอสีถูกพิกเซล
function ramp3(baseHex, dark, light) {
  const [r, g, b] = hexToRgb(baseHex);
  const [hdeg, s, v] = rgbToHsv(r, g, b);
  const vDark = Math.max(0.06, v * (1 - dark));
  const vLight = Math.min(1, v + (1 - v) * light);
  const out = [];
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const vv = vDark + (vLight - vDark) * t;
    let hh, ss;
    if (t < 0.5) {
      hh = toward(hdeg, 240, (0.5 - t) * 2 * 14.0);
      ss = Math.min(1, s * (1 + 0.25 * (0.5 - t) * 2));
    } else {
      hh = toward(hdeg, 60, (t - 0.5) * 2 * 14.0);
      ss = s * (1 - 0.45 * (t - 0.5) * 2);
    }
    out.push(hsvToRgb(hh, Math.max(0, ss), Math.max(0, Math.min(1, vv))));
  }
  out[1] = [r, g, b];
  return out; // [lo, mid, hi] as [r,g,b]
}

// opts = { hair: "#rrggbb" | null, shirt: "#rrggbb" | null } — null = ใช้สีเดิมของ variant
export function makeCustomSheet(world, variant, opts = {}) {
  const { frameW, frameH } = world.config;
  const meta = world.avatarMeta.variants[variant];
  const w = frameW * 12, h = frameH;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(world.sheetImg, 0, variant * frameH, w, h, 0, 0, w, h);
  if (!opts.hair && !opts.shirt) return canvas;

  const swaps = [];
  if (opts.shirt) {
    const [lo, mid, hi] = ramp3(opts.shirt, 0.35, 0.35);
    swaps.push([hexToRgb(meta.shirtLo), lo]);
    swaps.push([hexToRgb(meta.shirt), mid]);
    swaps.push([hexToRgb(meta.shirtHi), hi]);
  }
  if (opts.hair) {
    const [lo, mid, hi] = ramp3(opts.hair, 0.30, 0.45);
    swaps.push([hexToRgb(meta.hairLo), lo]);
    swaps.push([hexToRgb(meta.hair), mid]);
    swaps.push([hexToRgb(meta.hairHi), hi]);
  }

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    for (const [from, to] of swaps) {
      if (d[i] === from[0] && d[i + 1] === from[1] && d[i + 2] === from[2]) {
        d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2];
        break;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
