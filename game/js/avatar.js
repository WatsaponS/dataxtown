// Recolor ตัวละคร — สไปรท์ต้นฉบับ (office-avatar-sprites, ผ่าน build_avatars.py) มาพร้อม
// hair mask / clothing mask แยกต่างหาก (พิกเซลขาว = จุดที่ recolor ได้) แทนระบบ swap สีตรง ๆ
// แบบเดิม — เปลี่ยนสีได้ทุกเฉดที่ผู้เล่นเลือก ไม่จำกัดแค่ variant สีที่เตรียมไว้ล่วงหน้า
// อัลกอริทึมตรงกับ pixel-art/office-avatar-sprites/build.py's recolor(): คงความสว่างเดิมของ
// แต่ละพิกเซลไว้ (normalize เทียบ min/max ในโซนนั้น) แล้วคูณด้วยสีเป้าหมาย ใบหน้า/กางเกง/รองเท้า
// ไม่ถูกแตะเลยเพราะอยู่นอกมาสก์

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function maskRowData(maskImg, variant, w, h, frameH) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cx = c.getContext("2d");
  cx.drawImage(maskImg, 0, variant * frameH, w, h, 0, 0, w, h);
  return cx.getImageData(0, 0, w, h).data;
}

// exported เพื่อให้ sprites.js (ตัวละครความละเอียดสูง) เรียกใช้อัลกอริทึม recolor เดียวกันได้
// โดยไม่ต้อง duplicate โค้ด — ทำงานบน ImageData ธรรมดา ไม่ผูกกับขนาดเฟรม/เลย์เอาต์ระบบไหนเป็นพิเศษ
export function applyMaskRecolor(d, maskData, targetHex) {
  const [tr, tg, tb] = hexToRgb(targetHex);
  let lo = 255, hi = 0;
  for (let i = 0; i < maskData.length; i += 4) {
    if (maskData[i] < 128) continue;
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < maskData.length; i += 4) {
    if (maskData[i] < 128) continue;
    const v = Math.max(d[i], d[i + 1], d[i + 2]);
    const k = 0.55 + 0.45 * ((v - lo) / span);
    d[i] = Math.round(tr * k);
    d[i + 1] = Math.round(tg * k);
    d[i + 2] = Math.round(tb * k);
  }
}

// opts = { hair: "#rrggbb" | null, shirt: "#rrggbb" | null } — null = ใช้สีเดิมของสไปรท์ต้นฉบับ
export function makeCustomSheet(world, variant, opts = {}) {
  const { frameW, frameH } = world.config;
  const totalCols = world.avatarMeta.dirs.length * world.avatarMeta.frames;
  const w = frameW * totalCols, h = frameH;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(world.sheetImg, 0, variant * frameH, w, h, 0, 0, w, h);
  if (!opts.hair && !opts.shirt) return canvas;

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  if (opts.hair) applyMaskRecolor(d, maskRowData(world.hairMaskImg, variant, w, h, frameH), opts.hair);
  if (opts.shirt) applyMaskRecolor(d, maskRowData(world.clothingMaskImg, variant, w, h, frameH), opts.shirt);
  ctx.putImageData(img, 0, 0);
  return canvas;
}
